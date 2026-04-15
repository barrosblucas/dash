"""Testes do scheduler de scraping com sincronização de PDF."""

from __future__ import annotations

from typing import Any

import pytest
from apscheduler.triggers.interval import IntervalTrigger

from backend.services.expense_pdf_sync_service import ExpensePDFSyncResult
from backend.services.scraping_scheduler import ScrapingScheduler


def test_start_configura_intervalo_de_um_minuto_e_execucao_imediata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scheduler = ScrapingScheduler()
    captured: dict[str, Any] = {}

    def fake_add_job(func: Any, trigger: IntervalTrigger, **kwargs: Any) -> None:
        captured["func"] = func
        captured["trigger"] = trigger
        captured["kwargs"] = kwargs

    def fake_start() -> None:
        captured["started"] = True

    monkeypatch.setattr(scheduler._scheduler, "add_job", fake_add_job)
    monkeypatch.setattr(scheduler._scheduler, "start", fake_start)

    scheduler.start()

    assert captured["started"] is True
    assert isinstance(captured["trigger"], IntervalTrigger)
    assert captured["trigger"].interval.total_seconds() == 60
    assert captured["kwargs"]["id"] == "scrape_recurring"
    assert captured["kwargs"]["next_run_time"] is not None


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

    monkeypatch.setattr(scheduler, "_sync_expenses_pdf", fake_sync_expenses_pdf)
    monkeypatch.setattr(
        scheduler,
        "_create_scraping_service",
        lambda: FakeScrapingService(),
    )

    result = await scheduler.trigger_manual(year=2026, data_type="despesas")

    assert result["despesas_pdf_sync"]["success"] is False
    assert "falha no download" in result["errors"]
