"""
Handler para Convênios — lê do banco local.

Os dados são inseridos via scraping do portal Quality (convenio_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.features.convenio.convenio_data import (
    get_anos_disponiveis,
    get_convenio_detalhe,
    list_convenios,
    list_movimentacoes,
    sum_despesas,
    sum_receitas,
)
from backend.features.convenio.convenio_types import (
    ConvenioItem,
    ConvenioListResponse,
    ConvenioMovimentacaoResponse,
    ConvenioResumoAnual,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/convenios", tags=["convenios"])


@router.get(
    "/busca",
    response_model=ConvenioListResponse,
    summary="Busca convênios por ano",
)
def busca_convenios(
    ano: int = Query(..., description="Ano de referência"),
    tipo: str | None = Query(None, description="Filtrar por tipo (Concedido/Recebido)"),
    db: Session = Depends(get_db),
) -> ConvenioListResponse:
    """Consulta convênios do cache local para um ano específico.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_convenios(db, ano, tipo)

    total_receitas = sum_receitas(db, ano)
    total_despesas = sum_despesas(db, ano)

    resumo = ConvenioResumoAnual(
        ano=ano,
        quantidade_convenios=len(items),
        total_valor=round(sum(i.valor for i in items), 2),
        total_receitas=round(total_receitas, 2),
        total_despesas=round(total_despesas, 2),
    )

    return ConvenioListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/detalhe",
    response_model=ConvenioItem,
    summary="Busca detalhes de um convênio",
)
def get_convenio(
    ano: int = Query(..., description="Ano de referência"),
    numero: str = Query(..., description="Número do convênio"),
    db: Session = Depends(get_db),
) -> ConvenioItem:
    """Consulta detalhes de um convênio específico do cache local."""
    detalhe = get_convenio_detalhe(db, ano, numero)
    if detalhe is None:
        raise HTTPException(
            status_code=404,
            detail=f"Convênio {numero}/{ano} não encontrado",
        )
    return detalhe


@router.get(
    "/movimentacoes",
    response_model=ConvenioMovimentacaoResponse,
    summary="Busca movimentações de convênios por ano",
)
def busca_movimentacoes(
    ano: int = Query(..., description="Ano de referência"),
    tipo: str | None = Query(
        None, description="Filtrar por tipo (receita/despesa)"
    ),
    db: Session = Depends(get_db),
) -> ConvenioMovimentacaoResponse:
    """Consulta movimentações de convênios do cache local."""
    items = list_movimentacoes(db, ano, tipo)

    return ConvenioMovimentacaoResponse(
        items=items,
        quantidade=len(items),
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com convênios disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem convênios registrados no cache local."""
    return get_anos_disponiveis(db)
