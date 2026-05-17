"""
Handler para Contratos — lê do banco local.

Os dados são inseridos via scraping do portal Quality (contrato_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.contrato.contrato_data import (
    get_anos_disponiveis,
    get_contrato_detalhe,
    list_contratos,
)
from backend.features.contrato.contrato_types import (
    ContratoDetalhe,
    ContratoListResponse,
    ContratoResumoAnual,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contratos", tags=["contratos"])


@router.get(
    "/busca",
    response_model=ContratoListResponse,
    summary="Busca contratos por ano",
)
def busca_contratos(
    ano: int = Query(..., description="Ano de referência"),
    tipo: str | None = Query(None, description="Filtrar por tipo de contrato"),
    db: Session = Depends(get_db),
) -> ContratoListResponse:
    """Consulta contratos do cache local para um ano específico.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_contratos(db, ano, tipo)

    quantidade_principais = sum(
        1 for i in items if i.tipo.upper() == "CONTRATO PRINCIPAL"
    )
    quantidade_aditivos = len(items) - quantidade_principais

    resumo = ContratoResumoAnual(
        ano=ano,
        quantidade_contratos=len(items),
        total_valor=round(sum(i.valor for i in items), 2),
        quantidade_principais=quantidade_principais,
        quantidade_aditivos=quantidade_aditivos,
    )

    return ContratoListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/{ano}/{numero}",
    response_model=ContratoDetalhe,
    summary="Busca detalhes de um contrato",
)
def get_contrato(
    ano: int,
    numero: str,
    db: Session = Depends(get_db),
) -> ContratoDetalhe:
    """Consulta detalhes de um contrato específico do cache local."""
    detalhe = get_contrato_detalhe(db, ano, numero)
    if detalhe is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=f"Contrato {numero}/{ano} não encontrado",
        )
    return detalhe


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com contratos disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem contratos registrados no cache local."""
    return get_anos_disponiveis(db)
