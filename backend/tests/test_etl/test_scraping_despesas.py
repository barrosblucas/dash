"""Testes de scraping de despesas (cenários API, fallback e replace)."""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from typing import Any

import pytest

from backend.features.despesa.despesa_types import Despesa
from backend.features.scraping.scraping_orchestrator import ScrapingService
from backend.tests.test_etl.conftest import LogCapture, _build_despesa


@pytest.mark.asyncio
async def test_scrape_despesas_usa_fallback_pdf_quando_api_vazia(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    log_capture: LogCapture,
    patch_db_session: None,
    patch_sync_state: None,
    patch_scraping_logs: None,
) -> None:
    fallback_despesa = _build_despesa()
    fallback_called: list[int] = []
    captured: dict[str, Any] = {}

    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        fallback_called.append(year)
        return [fallback_despesa]

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._replace_despesas_for_year",
        fake_replace_despesas_for_year,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert result.records_processed == 1
    assert result.records_inserted == 1
    assert result.records_updated == 0
    assert fallback_called == [2026]
    assert captured["despesas"] == [fallback_despesa]
    assert log_capture.captured["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_scrape_despesas_retorna_no_data_e_nao_replace_quando_sem_fonte(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    log_capture: LogCapture,
    patch_db_session: None,
    patch_sync_state: None,
    patch_scraping_logs: None,
) -> None:
    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        return []

    def fail_if_replace_called(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        raise AssertionError("Nao deveria substituir despesas quando nao ha dados")

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._replace_despesas_for_year",
        fail_if_replace_called,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is False
    assert result.records_processed == 0
    assert result.records_inserted == 0
    assert result.records_updated == 0
    assert result.errors
    assert "Nenhum dado de despesas disponível" in result.errors[0]
    assert log_capture.captured["status"] == "NO_DATA"
    assert log_capture.captured["processed"] == 0
    assert log_capture.captured["inserted"] == 0
    assert log_capture.captured["updated"] == 0


@pytest.mark.asyncio
async def test_scrape_despesas_nao_usa_fallback_quando_api_tem_dados(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    log_capture: LogCapture,
    patch_db_session: None,
    patch_sync_state: None,
    patch_scraping_logs: None,
) -> None:
    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {
            "quantidadeRegistro": 1,
            "0": {
                "mes": "JANEIRO",
                "empenhado": "100,00",
                "liquidado": "90,00",
                "pago": "80,00",
            },
        }

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    fallback_called = False

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        nonlocal fallback_called
        fallback_called = True
        return [_build_despesa()]

    captured: dict[str, Any] = {}

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    monkeypatch.setattr(
        service._api, "fetch_despesas_annual", fake_fetch_despesas_annual
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service, "_load_despesas_from_pdf", fake_load_despesas_from_pdf
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._replace_despesas_for_year",
        fake_replace_despesas_for_year,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert result.records_processed == 1
    assert fallback_called is False
    assert len(captured["despesas"]) == 1
    assert captured["despesas"][0].fonte == "SCRAPING_2026"
    assert log_capture.captured["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_scrape_despesas_ignora_natureza_sem_annual_e_usa_pdf(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    log_capture: LogCapture,
    patch_db_session: None,
    patch_sync_state: None,
    patch_scraping_logs: None,
) -> None:
    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {"quantidade": 1}

    natureza_despesa = _build_despesa(fonte="SCRAPING_2026")
    fallback_despesa = _build_despesa(fonte="PDF_2026")
    fallback_called = False
    captured: dict[str, Any] = {}

    def fake_parse_despesas_annual(data: dict[str, Any], year: int) -> list[Despesa]:
        return []

    def fake_parse_despesas_natureza(
        data: dict[str, Any], year: int
    ) -> list[Despesa]:
        return [natureza_despesa]

    def fail_if_merge_called(
        annual: list[Despesa], natureza: list[Despesa]
    ) -> list[Despesa]:
        raise AssertionError("Merge nao deve ser usado sem dados anuais")

    def fake_load_despesas_from_pdf(year: int) -> list[Despesa]:
        nonlocal fallback_called
        fallback_called = True
        return [fallback_despesa]

    def fake_replace_despesas_for_year(
        session: object, despesas: list[Despesa], year: int
    ) -> tuple[int, int]:
        captured["despesas"] = despesas
        assert year == 2026
        return len(despesas), 0

    monkeypatch.setattr(
        service._api,
        "fetch_despesas_annual",
        fake_fetch_despesas_annual,
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_annual",
        fake_parse_despesas_annual,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_natureza",
        fake_parse_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "merge_despesas",
        fail_if_merge_called,
    )
    monkeypatch.setattr(
        service,
        "_load_despesas_from_pdf",
        fake_load_despesas_from_pdf,
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._replace_despesas_for_year",
        fake_replace_despesas_for_year,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert fallback_called is True
    assert captured["despesas"] == [fallback_despesa]
    assert captured["despesas"] != [natureza_despesa]
    assert log_capture.captured["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_scrape_despesas_2026_usa_replace_por_ano(
    monkeypatch: pytest.MonkeyPatch,
    service: ScrapingService,
    patch_db_session: None,
    patch_sync_state: None,
) -> None:
    async def fake_fetch_despesas_annual(year: int) -> dict[str, Any]:
        return {"quantidadeRegistro": 1}

    async def fake_fetch_despesas_natureza(year: int) -> dict[str, Any]:
        return {}

    despesas = [_build_despesa(fonte="SCRAPING_2026")]
    replace_called = False
    upsert_called = False

    def fake_replace_despesas_for_year(
        session: object, despesas_data: list[Despesa], year: int
    ) -> tuple[int, int]:
        nonlocal replace_called
        replace_called = True
        assert year == 2026
        assert despesas_data == despesas
        return 1, 0

    def fake_upsert_despesas(
        session: object, despesas_data: list[Despesa], year: int
    ) -> tuple[int, int]:
        nonlocal upsert_called
        upsert_called = True
        return 0, 0

    def fake_create_log(session: object, data_type: str, year: int) -> Any:
        return SimpleNamespace(started_at=datetime.now())

    def fake_finalize_log(
        session: object,
        log: Any,
        status: str,
        processed: int,
        inserted: int,
        updated: int,
    ) -> None:
        return None

    monkeypatch.setattr(
        service._api,
        "fetch_despesas_annual",
        fake_fetch_despesas_annual,
    )
    monkeypatch.setattr(
        service._api,
        "fetch_despesas_natureza",
        fake_fetch_despesas_natureza,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_annual",
        lambda data, year: despesas,
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "parse_despesas_natureza",
        lambda data, year: [],
    )
    monkeypatch.setattr(
        service._despesa_parser,
        "merge_despesas",
        lambda annual, natureza: despesas,
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._replace_despesas_for_year",
        fake_replace_despesas_for_year,
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._upsert_despesas",
        fake_upsert_despesas,
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._create_log",
        fake_create_log,
    )
    monkeypatch.setattr(
        "backend.features.scraping.scraping_orchestrator._finalize_log",
        fake_finalize_log,
    )

    result = await service.scrape_despesas(2026)

    assert result.success is True
    assert replace_called is True
    assert upsert_called is False
    assert result.records_inserted == 1
