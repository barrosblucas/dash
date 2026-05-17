"""
Scheduler periódico para sincronização de Diárias e Passagens.

Busca dados da API Quality a cada 10 minutos e persiste no banco local.
"""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.diaria.diaria_adapter import fetch_diarias
from backend.features.diaria.diaria_data import upsert_diarias
from backend.shared.database.connection import db_manager

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_MINUTES: int = 10
_MISFIRE_GRACE_SECONDS: int = 60


class DiariaScheduler:
    """Scheduler periódico para cache de diárias e passagens."""

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(
            job_defaults={
                "coalesce": True,
                "max_instances": 1,
                "misfire_grace_time": _MISFIRE_GRACE_SECONDS,
            },
        )
        self._last_sync_count: int = 0

    def start(self) -> None:
        self._scheduler.add_job(
            self.sync_job,
            trigger=IntervalTrigger(minutes=_SYNC_INTERVAL_MINUTES),
            next_run_time=datetime.now(),
            id="diaria_sync",
            name="diaria_sync_periodico",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler de diárias iniciado — intervalo: %d minutos",
            _SYNC_INTERVAL_MINUTES,
        )

    def stop(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler de diárias encerrado")

    async def sync_job(self) -> None:
        """Busca dados da API Quality e persiste no banco.

        Sincroniza ano atual e ano anterior.
        Exceções nunca propagam para o scheduler.
        """
        current_year = datetime.now().year
        years = [current_year, current_year - 1]
        total = 0

        try:
            for ano in years:
                for mes in range(1, 13):
                    items = await fetch_diarias(ano, mes)
                    if items:
                        with db_manager.get_session() as session:
                            count = upsert_diarias(session, items)
                            total += count
                            session.commit()
                    # Pequeno delay entre chamadas para não sobrecarregar API externa
                    await asyncio.sleep(0.5)

            self._last_sync_count = total
            logger.info(
                "Sync de diárias concluído — %d itens persistidos (anos=%s)",
                total,
                years,
            )
        except Exception:
            logger.exception("Erro inesperado no sync job de diárias")
