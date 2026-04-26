"""Scheduler periódico da feature saude."""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.saude.saude_business import SaudeSyncService
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_resource_catalog import DEFAULT_SYNC_RESOURCES
from backend.features.saude.saude_types import (
    SaudeSyncRequest,
    SaudeSyncTriggerType,
)
from backend.shared.database.connection import db_manager
from backend.shared.settings import get_settings

logger = logging.getLogger(__name__)


class SaudeScheduler:
    """Executa sincronizações periódicas do cache Saúde Transparente."""

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(
            job_defaults={
                "coalesce": True,
                "max_instances": 1,
                "misfire_grace_time": 60,
            }
        )
        self._last_run_result: dict[str, Any] | None = None
        self._sync_service = SaudeSyncService()

    def start(self) -> None:
        interval_minutes = get_settings().saude_sync_interval_minutes
        self._scheduler.add_job(
            self.sync_job,
            trigger=IntervalTrigger(minutes=interval_minutes),
            next_run_time=datetime.now(),
            id="saude_sync_recurring",
            name="saude_sync_periodico",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info("Scheduler de saúde iniciado — intervalo: %d minutos", interval_minutes)

    def stop(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler de saúde encerrado")

    async def sync_job(self) -> None:
        try:
            self._last_run_result = await self._run_sync(SaudeSyncTriggerType.SCHEDULED)
        except Exception:
            self._last_run_result = {
                "status": "error",
                "errors": ["Falha interna no scheduler"],
            }
            logger.exception("Erro ao executar sync agendado de saúde")

    async def trigger_manual(self, payload: SaudeSyncRequest) -> dict[str, Any]:
        try:
            return await self._run_sync(SaudeSyncTriggerType.MANUAL, payload)
        except Exception:
            logger.exception("Erro ao executar sync manual de saúde")
            started_at = datetime.now(UTC).replace(tzinfo=None)
            years = payload.years or [started_at.year, started_at.year - 1]
            resources = payload.resources or DEFAULT_SYNC_RESOURCES
            return {
                "status": "error",
                "years": years,
                "resources": resources,
                "synced_resources": 0,
                "failed_resources": len(resources),
                "errors": ["Falha interna no sync manual"],
                "started_at": started_at,
                "finished_at": datetime.now(UTC).replace(tzinfo=None),
            }

    def get_status(self) -> dict[str, Any]:
        next_run = None
        jobs = self._scheduler.get_jobs()
        if jobs:
            next_run = jobs[0].next_run_time
        return {
            "running": self._scheduler.running,
            "next_run_time": next_run.isoformat() if next_run else None,
            "last_run_result": self._last_run_result,
        }

    async def _run_sync(
        self,
        trigger_type: SaudeSyncTriggerType,
        payload: SaudeSyncRequest | None = None,
    ) -> dict[str, Any]:
        request = payload or SaudeSyncRequest()
        with db_manager.get_session() as session:
            repo = SQLSaudeRepository(session)
            response = await self._sync_service.sync(
                repo,
                request,
                trigger_type=trigger_type,
            )
        result = response.model_dump(mode="json")
        self._last_run_result = result
        return result
