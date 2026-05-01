"""
Scheduler do Diário Oficial.

Busca o Diário Oficial diariamente às 6h (edição regular)
e novamente às 16h (verifica edição suplementar).
"""

# mypy: disable-error-code=import-untyped

from __future__ import annotations

import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from backend.features.diario_oficial.diario_oficial_adapter import fetch_diario
from backend.features.diario_oficial.diario_oficial_types import DiarioResponse

logger = logging.getLogger(__name__)

_MISFIRE_GRACE_SECONDS: int = 300  # 5 minutos de tolerância


class DiarioOficialScheduler:
    """Scheduler periódico para busca do Diário Oficial.

    Busca às 6h (edição regular do dia) e às 16h (possível suplementar).
    Armazena o último resultado em memória para consumo via endpoint.
    """

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(
            job_defaults={
                "coalesce": True,
                "max_instances": 1,
                "misfire_grace_time": _MISFIRE_GRACE_SECONDS,
            },
        )
        self.ultimo_resultado: DiarioResponse | None = None

    def start(self) -> None:
        """Inicia o scheduler com jobs às 6h e 16h."""
        self._scheduler.add_job(
            self._fetch_manha,
            trigger=CronTrigger(hour=6, minute=0),
            id="diario_oficial_manha",
            name="diario_oficial_busca_manha",
            replace_existing=True,
        )
        self._scheduler.add_job(
            self._fetch_tarde,
            trigger=CronTrigger(hour=16, minute=0),
            id="diario_oficial_tarde",
            name="diario_oficial_busca_tarde",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler do Diário Oficial iniciado — jobs: 06:00 e 16:00"
        )

    def stop(self) -> None:
        """Encerra o scheduler graciosamente."""
        if self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler do Diário Oficial encerrado")

    async def _fetch_manha(self) -> None:
        """Job das 6h: busca edição regular do dia."""
        await self._fetch_e_atualizar("manhã (06:00)")

    async def _fetch_tarde(self) -> None:
        """Job das 16h: verifica se há edição suplementar.

        Se já houver edições no cache, apenas atualiza se encontrar
        edições adicionais (suplementares).
        """
        await self._fetch_e_atualizar("tarde (16:00)")

    async def _fetch_e_atualizar(self, label: str) -> None:
        """Executa a busca e atualiza o cache em memória.

        Args:
            label: Identificador do job para logging.
        """
        today = date.today()
        data_str = today.strftime("%d/%m/%Y")

        try:
            edicoes = await fetch_diario(today)
            if edicoes:
                self.ultimo_resultado = DiarioResponse(
                    data_consulta=data_str,
                    tem_edicao=True,
                    edicoes=edicoes,
                    mensagem=None,
                )
                regular = [e for e in edicoes if not e.suplementar]
                suplementar = [e for e in edicoes if e.suplementar]
                logger.info(
                    "Diário Oficial [%s] — %d edições (regular=%d, suplementar=%d)",
                    label,
                    len(edicoes),
                    len(regular),
                    len(suplementar),
                )
            elif self.ultimo_resultado is None:
                # Só registra "sem edição" se não há cache anterior
                self.ultimo_resultado = DiarioResponse(
                    data_consulta=data_str,
                    tem_edicao=False,
                    edicoes=[],
                    mensagem="Nenhuma edição publicada hoje.",
                )
                logger.info("Diário Oficial [%s] — nenhuma edição encontrada", label)
        except Exception:
            logger.exception(
                "Erro ao buscar Diário Oficial [%s] — cache não atualizado", label
            )
