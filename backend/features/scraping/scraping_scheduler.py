"""
Scheduler de scraping baseado em APScheduler.

Executa o pipeline de scraping periodicamente (a cada 10 minutos)
e integra com o ciclo de vida da aplicação FastAPI.
"""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, cast

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.scraping.expense_pdf_sync_service import (
    ExpensePDFSyncResult,
    ExpensePDFSyncService,
)

logger = logging.getLogger(__name__)

# Constantes de configuração
_SCRAPE_INTERVAL_MINUTES: int = 10
_MISFIRE_GRACE_SECONDS: int = 60


class ScrapingScheduler:
    """Scheduler periódico para o pipeline de scraping.

    Gerencia a execução automática do scraping a cada 10 minutos,
    permitindo também disparos manuais via API.

    Usage:
        scheduler = ScrapingScheduler()
        scheduler.start()
        # ... aplicação em execução ...
        scheduler.stop()
    """

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(
            job_defaults={
                "coalesce": True,
                "max_instances": 1,
                "misfire_grace_time": _MISFIRE_GRACE_SECONDS,
            },
        )
        self._last_run_result: dict[str, Any] | None = None
        self._expense_pdf_sync_service = ExpensePDFSyncService()
        self._historical_bootstrap_done: bool = False

    def start(self) -> None:
        """Inicia o scheduler com job recorrente de scraping."""
        self._scheduler.add_job(
            self.scrape_job,
            trigger=IntervalTrigger(minutes=_SCRAPE_INTERVAL_MINUTES),
            next_run_time=datetime.now(),
            id="scrape_recurring",
            name="scraping_periodico",
            replace_existing=True,
        )
        self._scheduler.add_job(
            self.historical_bootstrap_job,
            id="historical_bootstrap",
            name="bootstrap_historico",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler de scraping iniciado — intervalo: %d minutos",
            _SCRAPE_INTERVAL_MINUTES,
        )

    def stop(self) -> None:
        """Encerra o scheduler graciosamente."""
        if self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler de scraping encerrado")

    async def scrape_job(self) -> None:
        """Executa uma rodada do pipeline de scraping.

        Instancia o serviço, executa o scraping para o ano padrão
        e armazena o resultado. Exceções nunca propagam para o scheduler.
        """
        default_year = datetime.now().year
        try:
            pdf_sync_result = await self._sync_expenses_pdf(default_year)
            scraping_service = self._create_scraping_service()
            result = await scraping_service.run_full_scraping(year=default_year)
            result["despesas_pdf_sync"] = pdf_sync_result.to_dict()

            if not pdf_sync_result.success:
                result.setdefault("errors", []).append(pdf_sync_result.message)

            self._last_run_result = result
            logger.info(
                "Scraping concluído — ano=%d resultado=%s",
                default_year,
                _summarize_result(result),
            )
        except Exception:
            self._last_run_result = {"status": "error"}
            logger.exception(
                "Erro durante execução do scraping — ano=%d",
                default_year,
            )

    async def historical_bootstrap_job(self) -> None:
        """Executa o bootstrap histórico uma única vez."""
        if self._historical_bootstrap_done:
            return
        try:
            scraping_service = self._create_scraping_service()
            result = await scraping_service.run_historical_bootstrap()
            self._historical_bootstrap_done = True
            self._last_run_result = result
            logger.info(
                "Bootstrap histórico concluído — anos=%s",
                result.get("years_processed", []),
            )
        except Exception:
            logger.exception("Erro durante bootstrap histórico")

    async def trigger_historical_bootstrap(self) -> dict[str, Any]:
        """Dispara bootstrap histórico manualmente."""
        try:
            scraping_service = self._create_scraping_service()
            result = await scraping_service.run_historical_bootstrap()
            self._historical_bootstrap_done = True
            self._last_run_result = result
            logger.info(
                "Bootstrap histórico manual concluído — anos=%s",
                result.get("years_processed", []),
            )
            return cast(dict[str, Any], result)
        except Exception:
            logger.exception("Erro no bootstrap histórico manual")
            return {
                "status": "error",
                "years_processed": [],
                "errors": ["Erro no bootstrap histórico"],
            }

    async def trigger_manual(
        self, year: int | None = None, data_type: str = "all"
    ) -> dict[str, Any]:
        if year is None:
            year = datetime.now().year
        """Dispara scraping manualmente e retorna o resultado.

        Args:
            year: Ano de referência para o scraping.
            data_type: Tipo de dado (ex: "all", "receitas", "despesas").

        Returns:
            Dict com o resultado do scraping.
        """
        try:
            pdf_sync_result: ExpensePDFSyncResult | None = None
            if data_type in ("all", "despesas"):
                pdf_sync_result = await self._sync_expenses_pdf(year)

            scraping_service = self._create_scraping_service()
            result = cast(
                dict[str, Any],
                await scraping_service.run_scraping(year=year, data_type=data_type),
            )

            if pdf_sync_result is not None:
                result["despesas_pdf_sync"] = pdf_sync_result.to_dict()
                if not pdf_sync_result.success:
                    result.setdefault("errors", []).append(pdf_sync_result.message)

            self._last_run_result = result
            logger.info(
                "Scraping manual concluído — ano=%d data_type=%s",
                year,
                data_type,
            )
            return result
        except Exception:
            logger.exception(
                "Erro no scraping manual — ano=%d data_type=%s",
                year,
                data_type,
            )
            return {"status": "error", "year": year, "data_type": data_type}

    def get_status(self) -> dict[str, Any]:
        """Retorna o status atual do scheduler.

        Returns:
            Dict com running, next_run_time e last_run_result.
        """
        next_run: datetime | None = None
        jobs = self._scheduler.get_jobs()
        if jobs:
            next_run = jobs[0].next_run_time

        return {
            "running": self._scheduler.running,
            "next_run_time": next_run.isoformat() if next_run else None,
            "last_run_result": self._last_run_result,
        }

    def _create_scraping_service(self) -> Any:
        """Cria instância do serviço de scraping (importação lazy).

        Isola a dependência para permitir que o scheduler funcione
        mesmo quando o serviço ainda não foi implementado.

        Raises:
            ImportError: Se o serviço de scraping não estiver disponível.
        """
        from backend.features.scraping.scraping_orchestrator import ScrapingService

        return ScrapingService()

    async def _sync_expenses_pdf(self, year: int) -> ExpensePDFSyncResult:
        """Baixa e valida o PDF de despesas antes da rodada de scraping."""
        result = await self._expense_pdf_sync_service.sync_year_pdf(year)

        if result.success:
            logger.info(
                "Sincronização do PDF de despesas concluída — ano=%d bytes=%d",
                year,
                result.bytes_downloaded,
            )
        else:
            logger.warning(
                "Sincronização do PDF de despesas falhou — ano=%d motivo=%s",
                year,
                result.message,
            )

        return result


def _summarize_result(result: dict[str, Any]) -> str:
    """Extrai resumo legível do resultado de scraping.

    Args:
        result: Dict retornado pelo serviço de scraping.

    Returns:
        String resumida para logging.
    """
    status = result.get("status", "unknown")
    records = result.get("total_records")
    if records is not None:
        return f"status={status} records={records}"
    return f"status={status}"
