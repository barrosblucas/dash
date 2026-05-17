"""
Handler para Cargos — lê do banco local.

Os dados são inseridos via scraping do portal Quality (cargo_adapter).
Este handler apenas consulta o cache local.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.cargo.cargo_data import (
    get_anos_disponiveis,
    list_cargos,
)
from backend.features.cargo.cargo_types import (
    CargoItem,
    CargoListResponse,
    CargoResumoAnual,
    CargoResumoCategoria,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cargos", tags=["cargos"])


@router.get(
    "/busca",
    response_model=CargoListResponse,
    summary="Busca cargos por ano",
)
def busca_cargos(
    ano: int = Query(..., description="Ano de referência"),
    categoria: str | None = Query(None, description="Filtrar por categoria"),
    db: Session = Depends(get_db),
) -> CargoListResponse:
    """Consulta cargos do cache local para um ano específico.

    Os dados são sincronizados via scraping do portal Quality.
    """
    items = list_cargos(db, ano, categoria)

    # Agrupa por categoria para o resumo
    categorias_map: dict[str, list[CargoItem]] = {}
    for item in items:
        categorias_map.setdefault(item.categoria, []).append(item)

    categorias_resumo = [
        CargoResumoCategoria(
            categoria=cat,
            quantidade_cargos=len(cat_items),
            total_vagas=sum(i.vagas_totais for i in cat_items),
            total_ocupados=sum(i.vagas_ocupadas for i in cat_items),
            total_salario_base=round(sum(i.salario_base for i in cat_items), 2),
        )
        for cat, cat_items in sorted(categorias_map.items())
    ]

    resumo = CargoResumoAnual(
        ano=ano,
        quantidade_cargos=len(items),
        total_vagas=sum(i.vagas_totais for i in items),
        total_ocupados=sum(i.vagas_ocupadas for i in items),
        total_salario_base=round(sum(i.salario_base for i in items), 2),
        categorias=categorias_resumo,
    )

    return CargoListResponse(
        items=items,
        quantidade=len(items),
        resumo=resumo,
    )


@router.get(
    "/anos",
    response_model=list[int],
    summary="Lista anos com cargos disponíveis",
)
def get_anos(
    db: Session = Depends(get_db),
) -> list[int]:
    """Retorna anos que possuem cargos registrados no cache local."""
    return get_anos_disponiveis(db)
