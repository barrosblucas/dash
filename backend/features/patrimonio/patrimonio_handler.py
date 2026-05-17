"""
Handler para Patrimônio — lê do banco local.

Os dados são inseridos via scraping do portal Quality (patrimonio_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.patrimonio.patrimonio_data import (
    get_anos_disponiveis,
    get_resumo_anual,
    list_patrimonio,
)
from backend.features.patrimonio.patrimonio_types import (
    PatrimonioListResponse,
    PatrimonioResumoAnual,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patrimonio", tags=["patrimonio"])


@router.get(
    "/busca",
    response_model=PatrimonioListResponse,
    summary="Busca dados patrimoniais por ano",
)
def busca_patrimonio(
    ano: int = Query(..., description="Ano de referência"),
    tipo_bem: str | None = Query(
        None, description='Filtrar por tipo de bem ("Móvel", "Imóvel", "Veículo")'
    ),
    db: Session = Depends(get_db),
) -> PatrimonioListResponse:
    """Consulta dados patrimoniais do cache local para um ano específico.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_patrimonio(db, ano, tipo_bem)

    total_bens, total_valor, por_tipo = get_resumo_anual(db, ano)

    resumo = PatrimonioResumoAnual(
        ano=ano,
        total_bens=total_bens,
        total_valor=round(total_valor, 2),
        por_tipo=por_tipo,
    )

    return PatrimonioListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com dados patrimoniais disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem dados patrimoniais registrados no cache local."""
    return get_anos_disponiveis(db)
