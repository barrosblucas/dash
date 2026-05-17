"""
Handler para Diárias e Passagens — lê do banco local.

Os dados são inseridos via scraping do portal Quality (diaria_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.diaria.diaria_data import (
    get_anos_disponiveis,
    get_resumo_anual,
    list_diarias,
)
from backend.features.diaria.diaria_types import DiariaListResponse, DiariaResumoAnual
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diarias", tags=["diarias"])


@router.get(
    "/busca",
    response_model=DiariaListResponse,
    summary="Busca diárias por ano e mês",
)
def busca_diarias(
    ano: int = Query(..., description="Ano de referência"),
    mes: int | None = Query(None, description="Mês (1-12) para filtrar"),
    db: Session = Depends(get_db),
) -> DiariaListResponse:
    """Consulta diárias do cache local para um ano e mês específicos.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_diarias(db, ano, mes)

    quantidade_total, total_valor, total_devolvido, evolucao_mensal = get_resumo_anual(
        db, ano
    )

    resumo = DiariaResumoAnual(
        ano=ano,
        quantidade_total=quantidade_total,
        total_valor=round(total_valor, 2),
        total_devolvido=round(total_devolvido, 2),
        evolucao_mensal=evolucao_mensal,
    )

    return DiariaListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com diárias disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem diárias registradas no cache local."""
    return get_anos_disponiveis(db)
