"""
Handlers HTTP da feature Diário Oficial.

Endpoint público para consulta do Diário Oficial do dia.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import cast

from fastapi import APIRouter, Request

from backend.features.diario_oficial.diario_oficial_adapter import fetch_diario
from backend.features.diario_oficial.diario_oficial_types import DiarioResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/diario-oficial/hoje",
    response_model=DiarioResponse,
    tags=["diario-oficial"],
)
async def get_diario_hoje(request: Request) -> DiarioResponse:
    """Retorna as edições do Diário Oficial publicadas hoje.

    Consulta primeiro o cache em memória (atualizado pelo scheduler),
    com fallback para requisição direta ao site.

    Returns:
        DiarioResponse com as edições do dia.
    """
    data_hoje = date.today()
    data_str = data_hoje.strftime("%d/%m/%Y")

    # Tenta obter do cache do scheduler
    scheduler = getattr(request.app.state, "diario_oficial_scheduler", None)
    if scheduler is not None and scheduler.ultimo_resultado is not None:
        # Verifica se o cache é de hoje
        if scheduler.ultimo_resultado.data_consulta == data_str:
            logger.info("Retornando diário do cache do scheduler")
            return cast(DiarioResponse, scheduler.ultimo_resultado)

    # Fallback: busca direta
    try:
        edicoes = await fetch_diario(data_hoje)
        if edicoes:
            return DiarioResponse(
                data_consulta=data_str,
                tem_edicao=True,
                edicoes=edicoes,
                mensagem=None,
            )
        else:
            return DiarioResponse(
                data_consulta=data_str,
                tem_edicao=False,
                edicoes=[],
                mensagem="Nenhuma edição publicada hoje.",
            )
    except Exception as e:
        logger.exception("Erro ao consultar Diário Oficial")
        return DiarioResponse(
            data_consulta=data_str,
            tem_edicao=False,
            edicoes=[],
            mensagem=f"Não foi possível consultar o Diário Oficial: {e}",
        )
