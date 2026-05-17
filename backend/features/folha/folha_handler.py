"""
Handler para Folha de Pagamento — lê do banco local.

Os dados são inseridos via scraping do portal Quality (folha_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.folha.folha_data import (
    get_anos_disponiveis,
    get_resumo_mensal,
    list_employees,
    list_offices,
)
from backend.features.folha.folha_types import (
    FolhaEmployeeListResponse,
    FolhaOfficeListResponse,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/folha", tags=["folha"])


@router.get(
    "/offices",
    response_model=FolhaOfficeListResponse,
    summary="Lista órgãos/departamentos da folha",
)
def busca_offices(
    ano: int = Query(..., description="Ano de referência"),
    mes: int = Query(..., ge=1, le=12, description="Mês de referência (1-12)"),
    db: Session = Depends(get_db),
) -> FolhaOfficeListResponse:
    """Consulta órgãos e departamentos da folha de pagamento.

    Retorna a hierarquia de órgãos (secretarias) e seus departamentos.
    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_offices(db, ano, mes)
    return FolhaOfficeListResponse(
        items=items,
        quantidade=len(items),
    )


@router.get(
    "/employees",
    response_model=FolhaEmployeeListResponse,
    summary="Lista servidores da folha de pagamento",
)
def busca_employees(
    ano: int = Query(..., description="Ano de referência"),
    mes: int = Query(..., ge=1, le=12, description="Mês de referência (1-12)"),
    office_id: int | None = Query(None, description="Filtrar por ID do órgão"),
    department_id: int | None = Query(
        None, description="Filtrar por ID do departamento"
    ),
    keyword: str | None = Query(
        None, min_length=3, description="Busca por nome do servidor"
    ),
    db: Session = Depends(get_db),
) -> FolhaEmployeeListResponse:
    """Consulta servidores da folha de pagamento.

    Retorna registros individuais com dados salariais.
    Filtros opcionais: office_id, department_id, keyword.
    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_employees(db, ano, mes, office_id, department_id, keyword)

    resumo = get_resumo_mensal(db, ano, mes, office_id, department_id)

    return FolhaEmployeeListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com dados de folha disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem dados de folha registrados no cache local."""
    return get_anos_disponiveis(db)
