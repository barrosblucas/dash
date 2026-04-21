"""Testes do fallback de carregamento de despesas via PDF."""

from __future__ import annotations

from pathlib import Path

import pytest

from backend.services.scraping_service import ScrapingService
from backend.tests.test_etl.conftest import _build_despesa


def test_load_despesas_from_pdf_retorna_dados_do_extractor(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()
    fallback_despesa = _build_despesa()

    class FakeResult:
        def __init__(self) -> None:
            self.despesas = [fallback_despesa]
            self.erro: str | None = None

    class FakeExtractor:
        def __init__(self, dados_dir: Path) -> None:
            self.dados_dir = dados_dir

        def extract_despesas(
            self,
            ano: int | None = None,
            anos: list[int] | None = None,
        ) -> FakeResult:
            return FakeResult()

    monkeypatch.setattr(
        "backend.services.scraping_service.PDFExtractor", FakeExtractor
    )

    despesas = service._load_despesas_from_pdf(2026)

    assert despesas == [fallback_despesa]


def test_load_despesas_from_pdf_retorna_vazio_em_excecao(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = ScrapingService()

    class BrokenExtractor:
        def __init__(self, dados_dir: Path) -> None:
            raise RuntimeError("falha")

    monkeypatch.setattr(
        "backend.services.scraping_service.PDFExtractor",
        BrokenExtractor,
    )

    despesas = service._load_despesas_from_pdf(2026)

    assert despesas == []
