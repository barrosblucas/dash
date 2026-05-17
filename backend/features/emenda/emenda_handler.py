"""
Handler para Emendas Parlamentares — lê do banco local.

Os dados são inseridos via scraping do portal Quality (emenda_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.emenda.emenda_data import (
    get_anos_disponiveis,
    get_resumo_anual,
    list_emendas,
)
from backend.features.emenda.emenda_types import (
    EmendaListResponse,
    EmendaResumoAnual,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emendas", tags=["emendas"])


@router.get(
    "/busca",
    response_model=EmendaListResponse,
    summary="Busca emendas parlamentares por ano",
)
def busca_emendas(
    ano: int = Query(..., description="Ano de referência"),
    tipo: str | None = Query(None, description="Filtrar por tipo de emenda"),
    db: Session = Depends(get_db),
) -> EmendaListResponse:
    """Consulta emendas parlamentares do cache local para um ano específico.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_emendas(db, ano, tipo)

    quantidade_emendas, total_valor, por_tipo = get_resumo_anual(db, ano)

    resumo = EmendaResumoAnual(
        ano=ano,
        quantidade_emendas=quantidade_emendas,
        total_valor=round(total_valor, 2),
        por_tipo=por_tipo,
    )

    return EmendaListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com emendas parlamentares disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem emendas registradas no cache local."""
    return get_anos_disponiveis(db)
