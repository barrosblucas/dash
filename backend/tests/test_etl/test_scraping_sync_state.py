"""Testes de sincronização de estado do scraping (hash match / NO_CHANGE)."""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from typing import Any

import pytest

from backend.features.scraping.scraping_orchestrator import ScrapingService


@pytest.fixture
def service() -> ScrapingService:
    return ScrapingService()


class FakeSession:
    """Minimal fake session that records calls."""

    def __init__(self) -> None:
        self.calls: list[str] = []

    def __enter__(self) -> FakeSession:
        return self

    def __exit__(self, *args: object) -> None:
        pass

    def add(self, obj: object) -> None:
        self.calls.append("add")

    def flush(self) -> None:
        self.calls.append("flush")

    def execute(self, stmt: object) -> None:
        self.calls.append("execute")

    def query(self, model: object) -> FakeQuery:
        return FakeQuery()


class FakeQuery:
    def filter(self, *args: object) -> FakeQuery:
        return self

    def first(self) -> None:
        return None


@pytest.mark.asyncio
async def test_scrape_receitas_retorna_no_change_quando_hash_igual(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
) -> None:
    """Quando o hash do payload bate com o armazenado, retorna NO_CHANGE sem reescrever."""

    async def fake_fetch_revenue_monthly(year: int) -> list[dict[str, Any]]:
        return [{"mes": "JANEIRO", "valorArrecadado": "100.00"}]

    async def fake_fetch_revenue_detailing(year: int) -> list[dict[str, Any]]:
        return [{"nivel": 1, "descricao": "test", "rubrica": "1.0", "analitica": "S"}]

    monkeypatch.setattr(
        service._api, "fetch_revenue_monthly", fake_fetch_revenue_monthly
    )
    monkeypatch.setattr(
        service._api, "fetch_revenue_detailing", fake_fetch_revenue_detailing
    )

    raw_monthly = [{"mes": "JANEIRO", "valorArrecadado": "100.00"}]
    raw_detail = [{"nivel": 1, "descricao": "test", "rubrica": "1.0", "analitica": "S"}]
    combined = {"monthly": raw_monthly, "detailing": raw_detail}
    expected_hash = service._compute_payload_hash(combined)

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._get_sync_state_hash",
        lambda session, key, ano: expected_hash,
    )

    sync_state_calls: list[dict[str, Any]] = []

    def fake_upsert_sync_state(
        session: object,
        key: str,
        ano: int,
        hash_val: str,
        count: int,
        status: str,
    ) -> None:
        sync_state_calls.append({"key": key, "hash": hash_val, "status": status})

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._upsert_sync_state",
        fake_upsert_sync_state,
    )

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._create_log",
        lambda session, data_type, year: SimpleNamespace(started_at=datetime.now()),
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._finalize_log",
        lambda session, log, status, processed, inserted, updated: None,
    )

    fake_session = FakeSession()
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator.db_manager",
        SimpleNamespace(get_session=lambda: fake_session),
    )

    result = await service.scrape_receitas(2025)

    assert result.success is True
    assert "NO_CHANGE" in result.errors
    assert result.records_processed == 0
    assert result.records_inserted == 0
    assert result.records_updated == 0

    assert len(sync_state_calls) == 1
    assert sync_state_calls[0]["status"] == "NO_CHANGE"
    assert sync_state_calls[0]["hash"] == expected_hash


@pytest.mark.asyncio
async def test_scrape_despesas_retorna_no_change_quando_hash_igual(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
) -> None:
    """Quando o hash de despesas bate com o armazenado, retorna NO_CHANGE."""

    annual_data: dict[str, Any] = {
        "quantidadeRegistro": 1,
        "0": {"mes": "Janeiro", "empenhado": "100", "liquidado": "100", "pago": "100"},
    }
    natureza_data: dict[str, Any] = {}

    async def fake_fetch_annual(year: int) -> dict[str, Any]:
        return annual_data

    async def fake_fetch_natureza(year: int) -> dict[str, Any]:
        return natureza_data

    monkeypatch.setattr(service._api, "fetch_despesas_annual", fake_fetch_annual)
    monkeypatch.setattr(service._api, "fetch_despesas_natureza", fake_fetch_natureza)

    combined = {"annual": annual_data, "natureza": natureza_data}
    expected_hash = service._compute_payload_hash(combined)

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._get_sync_state_hash",
        lambda session, key, ano: expected_hash,
    )

    sync_state_calls: list[dict[str, Any]] = []

    def fake_upsert_sync_state(
        session: object,
        key: str,
        ano: int,
        hash_val: str,
        count: int,
        status: str,
    ) -> None:
        sync_state_calls.append({"key": key, "status": status})

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._upsert_sync_state",
        fake_upsert_sync_state,
    )

    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._create_log",
        lambda session, data_type, year: SimpleNamespace(started_at=datetime.now()),
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._finalize_log",
        lambda session, log, status, processed, inserted, updated: None,
    )

    fake_session = FakeSession()
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator.db_manager",
        SimpleNamespace(get_session=lambda: fake_session),
    )

    result = await service.scrape_despesas(2025)

    assert result.success is True
    assert "NO_CHANGE" in result.errors
    assert result.records_processed == 0
    assert sync_state_calls[0]["status"] == "NO_CHANGE"


def test_is_year_fully_synced_aceita_no_change_como_synced() -> None:
    """_is_year_fully_synced deve considerar NO_CHANGE como sincronizado."""
    from backend.features.scraping.scraping_helpers import _is_year_fully_synced

    class FakeState:
        def __init__(self, status: str) -> None:
            self.status = status

    class FakeQueryWithCounter:
        def __init__(self, call_index: int) -> None:
            self._call_index = call_index

        def filter(self, *args: object) -> FakeQueryWithCounter:
            return self

        def first(self) -> FakeState:
            if self._call_index == 1:
                return FakeState("NO_CHANGE")
            return FakeState("SUCCESS")

    class FakeSessionWithCounter:
        def __init__(self) -> None:
            self._query_count = 0

        def query(self, model: object) -> FakeQueryWithCounter:
            self._query_count += 1
            return FakeQueryWithCounter(self._query_count)

    result = _is_year_fully_synced(FakeSessionWithCounter(), 2025)  # type: ignore[arg-type]
    assert result is True


def test_is_year_fully_synced_rejeita_status_nao_synced() -> None:
    """_is_year_fully_synced deve rejeitar status ERROR."""
    from backend.features.scraping.scraping_helpers import _is_year_fully_synced

    class FakeState:
        def __init__(self, status: str) -> None:
            self.status = status

    class FakeSession:
        def query(self, model: object) -> FakeQuery:
            return FakeQuery()

    class FakeQuery:
        def filter(self, *args: object) -> FakeQuery:
            return self

        def first(self) -> FakeState:
            return FakeState("ERROR")

    result = _is_year_fully_synced(FakeSession(), 2025)  # type: ignore[arg-type]
    assert result is False


def test_is_year_fully_synced_rejeita_none() -> None:
    """_is_year_fully_synced deve rejeitar quando state é None."""
    from backend.features.scraping.scraping_helpers import _is_year_fully_synced

    class FakeSession:
        def query(self, model: object) -> FakeQuery:
            return FakeQuery()

    class FakeQuery:
        def filter(self, *args: object) -> FakeQuery:
            return self

        def first(self) -> None:
            return None

    result = _is_year_fully_synced(FakeSession(), 2025)  # type: ignore[arg-type]
    assert result is False
