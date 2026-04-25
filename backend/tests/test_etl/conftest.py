"""Fixtures e helpers compartilhados para testes ETL."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from typing import Any

import pytest

from backend.features.despesa.despesa_scraper import DespesaScraper
from backend.features.despesa.despesa_types import Despesa, TipoDespesa
from backend.features.scraping.scraping_orchestrator import ScrapingService


@pytest.fixture
def scraper() -> DespesaScraper:
    """Instância de DespesaScraper para testes."""
    return DespesaScraper()


@pytest.fixture
def service() -> ScrapingService:
    """Instância de ScrapingService para testes."""
    return ScrapingService()


@contextmanager
def _fake_session_context() -> Iterator[object]:
    """Fornece sessão fake para evitar I/O real de banco nos testes."""
    yield object()


def _build_despesa(fonte: str = "PDF_2026") -> Despesa:
    """Factory de despesa válida para cenários de teste."""
    return Despesa(
        ano=2026,
        mes=1,
        valor_empenhado=Decimal("100.00"),
        valor_liquidado=Decimal("90.00"),
        valor_pago=Decimal("80.00"),
        tipo=TipoDespesa.CORRENTE,
        fonte=fonte,
    )


class LogCapture:
    """Captura chamadas de logging do scraping para assertions."""

    def __init__(self) -> None:
        self.captured: dict[str, Any] = {}

    def create_log(self, session: object, data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def finalize_log(
        self,
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        self.captured["status"] = status
        self.captured["processed"] = processed
        self.captured["inserted"] = inserted
        self.captured["updated"] = updated


@pytest.fixture
def log_capture() -> LogCapture:
    return LogCapture()


@pytest.fixture
def patch_db_session(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch db_manager.get_session para evitar I/O de banco."""
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator.db_manager.get_session",
        _fake_session_context,
    )
