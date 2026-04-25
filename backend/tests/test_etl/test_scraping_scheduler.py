"""Testes do scheduler de scraping com sincronização de PDF."""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

from typing import Any

import pytest
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.scraping.expense_pdf_sync_service import ExpensePDFSyncResult
from backend.features.scraping.scraping_scheduler import ScrapingScheduler


def test_start_configura_intervalo_de_dez_minutos_e_execucao_imediata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = ScrapingScheduler()
    captured: list[dict[str, Any]] = []

    def fake_add_job(func: Any, trigger: IntervalTrigger | None = None, **kwargs: Any) -> None:
        captured.append({"func": func, "trigger": trigger, "kwargs": kwargs})

    def fake_start() -> None:
        captured.append({"started": True})

    monkeypatch.setattr(scheduler._scheduler, "add_job", fake_add_job)
    monkeypatch.setattr(scheduler._scheduler, "start", fake_start)

    scheduler.start()

    assert any(call.get("started") is True for call in captured)
    recurring_call = next(call for call in captured if "trigger" in call)
    assert isinstance(recurring_call["trigger"], IntervalTrigger)
    assert recurring_call["trigger"].interval.total_seconds() == 600
    assert recurring_call["kwargs"]["id"] == "scrape_recurring"
    assert recurring_call["kwargs"]["next_run_time"] is not None


@pytest.mark.asyncio
async def test_scrape_job_anexa_status_de_sincronizacao_pdf(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = ScrapingScheduler()

    async def fake_sync_expenses_pdf(year: int) -> ExpensePDFSyncResult:
        return ExpensePDFSyncResult(
            success=True,
            year=year,
            file_path="/tmp/2026.pdf",
            bytes_downloaded=2048,
            status_code=200,
            message="ok",
        )

    class FakeScrapingService:
        async def run_scraping(
            self,
            year: int = 2026,
            data_type: str = "all",
        ) -> dict[str, Any]:
            return {
                "status": "SUCCESS",
                "receitas_processed": 4,
                "despesas_processed": 12,
                "total_inserted": 16,
                "total_updated": 0,
                "errors": [],
            }

        async def run_full_scraping(
            self,
            year: int = 2026,
        ) -> dict[str, Any]:
            return await self.run_scraping(year=year, data_type="all")

    monkeypatch.setattr(scheduler, "_sync_expenses_pdf", fake_sync_expenses_pdf)
    monkeypatch.setattr(
        scheduler,
        "_create_scraping_service",
        lambda: FakeScrapingService(),
    )

    await scheduler.scrape_job()

    status = scheduler.get_status()
    last_result = status["last_run_result"]

    assert last_result is not None
    assert "despesas_pdf_sync" in last_result
    assert last_result["despesas_pdf_sync"]["success"] is True
    assert last_result["despesas_pdf_sync"]["bytes_downloaded"] == 2048


@pytest.mark.asyncio
async def test_trigger_manual_sincroniza_pdf_apenas_para_despesas_ou_all(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = ScrapingScheduler()
    sync_calls: list[int] = []

    async def fake_sync_expenses_pdf(year: int) -> ExpensePDFSyncResult:
        sync_calls.append(year)
        return ExpensePDFSyncResult(
            success=True,
            year=year,
            file_path="/tmp/2026.pdf",
            bytes_downloaded=2048,
            status_code=200,
            message="ok",
        )

    class FakeScrapingService:
        async def run_scraping(
            self,
            year: int = 2026,
            data_type: str = "all",
        ) -> dict[str, Any]:
            return {
                "status": "SUCCESS",
                "receitas_processed": 1,
                "despesas_processed": 1,
                "total_inserted": 2,
                "total_updated": 0,
                "errors": [],
            }

        async def run_full_scraping(
            self,
            year: int = 2026,
        ) -> dict[str, Any]:
            return await self.run_scraping(year=year, data_type="all")

    monkeypatch.setattr(scheduler, "_sync_expenses_pdf", fake_sync_expenses_pdf)
    monkeypatch.setattr(
        scheduler,
        "_create_scraping_service",
        lambda: FakeScrapingService(),
    )

    receitas_result = await scheduler.trigger_manual(year=2026, data_type="receitas")
    despesas_result = await scheduler.trigger_manual(year=2026, data_type="despesas")
    all_result = await scheduler.trigger_manual(year=2026, data_type="all")

    assert "despesas_pdf_sync" not in receitas_result
    assert "despesas_pdf_sync" in despesas_result
    assert "despesas_pdf_sync" in all_result
    assert sync_calls == [2026, 2026]


@pytest.mark.asyncio
async def test_trigger_manual_agrega_erro_quando_sync_pdf_falha(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = ScrapingScheduler()

    async def fake_sync_expenses_pdf(year: int) -> ExpensePDFSyncResult:
        return ExpensePDFSyncResult(
            success=False,
            year=year,
            file_path="/tmp/2026.pdf",
            bytes_downloaded=0,
            status_code=500,
            message="falha no download",
        )

    class FakeScrapingService:
        async def run_scraping(
            self,
            year: int = 2026,
            data_type: str = "all",
        ) -> dict[str, Any]:
            return {
                "status": "SUCCESS",
                "receitas_processed": 1,
                "despesas_processed": 1,
                "total_inserted": 2,
                "total_updated": 0,
                "errors": [],
            }

        async def run_full_scraping(
            self,
            year: int = 2026,
        ) -> dict[str, Any]:
            return await self.run_scraping(year=year, data_type="all")

    monkeypatch.setattr(scheduler, "_sync_expenses_pdf", fake_sync_expenses_pdf)
    monkeypatch.setattr(
        scheduler,
        "_create_scraping_service",
        lambda: FakeScrapingService(),
    )

    result = await scheduler.trigger_manual(year=2026, data_type="despesas")

    assert result["despesas_pdf_sync"]["success"] is False
    assert "falha no download" in result["errors"]
