"""
Rotas HTTP do bounded context legislação.

Apenas orquestração — delega para o adapter.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from backend.features.legislacao.legislacao_adapter import (
    fetch_legislacao_detalhe,
    fetch_legislacoes,
)
from backend.features.legislacao.legislacao_types import (
    LegislacaoDetalhe,
    LegislacaoListResponse,
    StatusLegislacao,
    TipoLegislacao,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/legislacao", tags=["legislacao"])


@router.get(
    "",
    response_model=LegislacaoListResponse,
    summary="Lista paginada de legislações municipais",
)
async def get_legislacoes(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    tipo: TipoLegislacao | None = Query(None, description="Filtro por tipo de legislação"),
    ano: int | None = Query(None, description="Filtro por ano"),
    status: StatusLegislacao | None = Query(None, description="Filtro por status"),
    busca: str | None = Query(None, description="Busca textual em ementa, número e autor"),
) -> LegislacaoListResponse:
    """Retorna lista paginada de legislações do município.

    Atualmente utiliza dados mockados — a fonte real será
    integrada futuramente via adapter.
    """
    return fetch_legislacoes(
        page=page,
        size=size,
        tipo=tipo,
        ano=ano,
        status=status,
        busca=busca,
    )


@router.get(
    "/{legislacao_id}",
    response_model=LegislacaoDetalhe,
    summary="Detalhe completo de uma legislação",
)
async def get_legislacao_detalhe(legislacao_id: str) -> LegislacaoDetalhe:
    """Retorna o detalhe completo de uma legislação pelo identificador.

    Atualmente utiliza dados mockados — a fonte real será
    integrada futuramente via adapter.
    """
    detalhe = fetch_legislacao_detalhe(legislacao_id)
    if detalhe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legislação não encontrada",
        )
    return detalhe
