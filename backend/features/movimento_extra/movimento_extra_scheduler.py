"""
Scheduler periódico para sincronização de Movimento Extra Orçamentário.

Busca dados da API Quality a cada 10 minutos e persiste no banco local.
"""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.features.movimento_extra.movimento_extra_adapter import (
    MovimentoExtraAPIError,
    fetch_tipo,
)
from backend.features.movimento_extra.movimento_extra_data import upsert_movimento_extra
from backend.shared.database.connection import db_manager

logger = logging.getLogger(__name__)

_SYNC_INTERVAL_MINUTES: int = 10
_MISFIRE_GRACE_SECONDS: int = 60


class MovimentoExtraScheduler:
    """Scheduler periódico para cache de movimento extra."""

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
            id="movimento_extra_sync",
            name="movimento_extra_sync_periodico",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler de movimento extra iniciado — intervalo: %d minutos",
            _SYNC_INTERVAL_MINUTES,
        )

    def stop(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler de movimento extra encerrado")

    async def sync_job(self) -> None:
        """Busca dados da API Quality e persiste no banco.

        Sincroniza ano atual e ano anterior (26 chamadas HTTP).
        Exceções nunca propagam para o scheduler.
        """
        current_year = datetime.now().year
        years = [current_year, current_year - 1]
        total = 0

        try:
            for ano in years:
                for mes in range(1, 13):
                    for tipo in ("R", "D"):
                        try:
                            items = await fetch_tipo(ano, mes, tipo)
                            if items:
                                with db_manager.get_session() as session:
                                    count = upsert_movimento_extra(session, items)
                                    total += count
                                    session.commit()
                        except MovimentoExtraAPIError as exc:
                            logger.warning(
                                "Erro API externa no sync job (ano=%s mes=%s tipo=%s): %s",
                                ano,
                                mes,
                                tipo,
                                exc.message,
                            )
                        # Pequeno delay entre chamadas para não sobrecarregar API externa
                        await asyncio.sleep(0.5)

            self._last_sync_count = total
            logger.info(
                "Sync de movimento extra concluído — %d itens persistidos (anos=%s)",
                total,
                years,
            )
        except Exception:
            logger.exception("Erro inesperado no sync job de movimento extra")
