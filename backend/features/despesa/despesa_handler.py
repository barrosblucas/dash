"""
Rotas da API para despesas.

Endpoints para consulta de despesas municipais.
Apenas orquestração HTTP — delega para data layer.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_data import (
    SQLDespesaBreakdownRepository,
    SQLDespesaRepository,
)
from backend.features.despesa.despesa_types import (
    DespesaBreakdownListResponse,
    DespesaBreakdownResponse,
    DespesaBreakdownTotalsResponse,
    DespesaListResponse,
    DespesaResponse,
    TipoDespesa,
)
from backend.shared.database.connection import get_db

router = APIRouter(prefix="/despesas", tags=["despesas"])

_VALIDOS = {"CORRENTE", "CAPITAL", "CONTINGENCIA"}


def _parse_tipo_despesa(tipo: str | None) -> TipoDespesa | None:
    """Converte string de tipo para enum, ou levanta erro."""
    if tipo is None:
        return None
    tipo_upper = tipo.upper()
    if tipo_upper not in _VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA.",
        )
    return TipoDespesa[tipo_upper]


@router.get("", response_model=DespesaListResponse, summary="Lista despesas")
async def listar_despesas(
    ano: int | None = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    mes: int | None = Query(None, ge=1, le=12, description="Filtrar por mês"),
    categoria: str | None = Query(None, description="Filtrar por categoria"),
    tipo: str | None = Query(
        None, description="Filtrar por tipo (CORRENTE, CAPITAL ou CONTINGENCIA)"
    ),
    ano_inicio: int | None = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: int | None = Query(None, ge=2013, le=2030, description="Ano final"),
    limit: int | None = Query(
        100, ge=1, le=1000, description="Limite de resultados"
    ),
    offset: int | None = Query(0, ge=0, description="Offset para paginação"),
    db: Session = Depends(get_db),
) -> DespesaListResponse:
    """
    Lista despesas com filtros opcionais.

    Permite filtrar por ano, mês, categoria, tipo, e intervalo de anos.
    Suporta paginação com limit e offset.

    Example:
        GET /api/v1/despesas?ano=2023&tipo=CORRENTE&limit=50
    """
    tipo_enum = _parse_tipo_despesa(tipo)

    repo = SQLDespesaRepository(db)
    despesas = repo.list_all(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
        ano_inicio=ano_inicio,
        ano_fim=ano_fim,
        limit=limit,
        offset=offset,
    )

    total = repo.count(
        ano=ano,
        mes=mes,
        categoria=categoria,
        tipo=tipo_enum,
    )

    despesas_response = [
        DespesaResponse(
            id=d.id,
            ano=d.ano,
            mes=d.mes,
            categoria=d.categoria,
            subcategoria=d.subcategoria,
            tipo=d.tipo.value,
            valor_empenhado=d.valor_empenhado,
            valor_liquidado=d.valor_liquidado,
            valor_pago=d.valor_pago,
            fonte=d.fonte,
        )
        for d in despesas
    ]

    page = ((offset or 0) // (limit or 1)) + 1 if limit else 1
    has_next = ((offset or 0) + (limit or 0)) < total if limit else False

    return DespesaListResponse(
        despesas=despesas_response,
        total=total,
        page=page,
        page_size=limit or len(despesas),
        has_next=has_next,
    )


@router.get(
    "/{despesa_id}", response_model=DespesaResponse, summary="Busca despesa por ID"
)
async def buscar_despesa(
    despesa_id: int,
    db: Session = Depends(get_db),
) -> DespesaResponse:
    """
    Busca uma despesa pelo seu ID.

    Example:
        GET /api/v1/despesas/123
    """
    repo = SQLDespesaRepository(db)
    despesa = repo.get_by_id(despesa_id)

    if despesa is None:
        raise HTTPException(
            status_code=404, detail=f"Despesa não encontrada: {despesa_id}"
        )

    return DespesaResponse(
        id=despesa.id,
        ano=despesa.ano,
        mes=despesa.mes,
        categoria=despesa.categoria,
        subcategoria=despesa.subcategoria,
        tipo=despesa.tipo.value,
        valor_empenhado=despesa.valor_empenhado,
        valor_liquidado=despesa.valor_liquidado,
        valor_pago=despesa.valor_pago,
        fonte=despesa.fonte,
    )


@router.get(
    "/categorias/", response_model=list[str], summary="Lista categorias de despesas"
)
async def listar_categorias(db: Session = Depends(get_db)) -> list[str]:
    """
    Retorna todas as categorias de despesa cadastradas.

    Example:
        GET /api/v1/despesas/categorias/
    """
    repo = SQLDespesaRepository(db)
    return repo.list_categorias()


@router.get(
    "/total/ano/{ano}", response_model=dict, summary="Total de despesas por ano"
)
async def total_despesas_ano(
    ano: int,
    tipo: str | None = Query(
        None, description="Tipo: CORRENTE, CAPITAL ou CONTINGENCIA"
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Calcula o total de despesas em um ano.

    Retorna totais de valor empenhado, liquidado e pago.

    Example:
        GET /api/v1/despesas/total/ano/2023
        GET /api/v1/despesas/total/ano/2023?tipo=CORRENTE
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    repo = SQLDespesaRepository(db)

    try:
        total_emp, total_liq, total_pago = repo.get_totais_por_ano(ano, tipo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "ano": ano,
        "tipo": tipo.upper() if tipo else None,
        "total_empenhado": float(total_emp),
        "total_liquidado": float(total_liq),
        "total_pago": float(total_pago),
    }


@router.get(
    "/total/mes/{ano}/{mes}", response_model=dict, summary="Total de despesas por mês"
)
async def total_despesas_mes(
    ano: int,
    mes: int,
    tipo: str | None = Query(
        None, description="Tipo: CORRENTE, CAPITAL ou CONTINGENCIA"
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Calcula o total de despesas em um mês específico.

    Retorna totais de valor empenhado, liquidado e pago.

    Example:
        GET /api/v1/despesas/total/mes/2023/6
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês deve estar entre 1 e 12")

    repo = SQLDespesaRepository(db)

    try:
        total_emp, total_liq, total_pago = repo.get_totais_por_mes(ano, mes, tipo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "ano": ano,
        "mes": mes,
        "tipo": tipo.upper() if tipo else None,
        "total_empenhado": float(total_emp),
        "total_liquidado": float(total_liq),
        "total_pago": float(total_pago),
    }


_VALID_BREAKDOWN_TYPES = {"ORGAO", "FUNCAO", "ELEMENTO", "NATUREZA"}


@router.get(
    "/breakdown/{breakdown_type}/{ano}",
    response_model=DespesaBreakdownListResponse,
    summary="Lista breakdown de despesas (órgão/função/elemento)",
)
async def listar_breakdown(
    breakdown_type: str,
    ano: int,
    mes: int | None = Query(None, ge=1, le=12, description="Filtrar por mês"),
    db: Session = Depends(get_db),
) -> DespesaBreakdownListResponse:
    """
    Lista dados de breakdown de despesas por tipo e ano.

    Tipos disponíveis: ORGAO, FUNCAO, ELEMENTO, NATUREZA

    Os dados são servidos do SQLite interno (populados pelo scraper).

    Example:
        GET /api/v1/despesas/breakdown/ORGAO/2025
        GET /api/v1/despesas/breakdown/FUNCAO/2023?mes=6
    """
    bt_upper = breakdown_type.upper()
    if bt_upper not in _VALID_BREAKDOWN_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido: {breakdown_type}. Use ORGAO, FUNCAO, ELEMENTO ou NATUREZA.",
        )

    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    repo = SQLDespesaBreakdownRepository(db)
    data = repo.list_by_type_and_year(bt_upper, ano, mes)

    breakdown_responses = [
        DespesaBreakdownResponse(
            id=d["id"],
            ano=d["ano"],
            mes=d["mes"],
            breakdown_type=d["breakdown_type"],
            item_label=d["item_label"],
            valor=d["valor"],
            fonte=d["fonte"],
        )
        for d in data
    ]

    return DespesaBreakdownListResponse(
        breakdown_type=bt_upper,
        ano=ano,
        data=breakdown_responses,
        total=len(breakdown_responses),
    )


@router.get(
    "/breakdown/{breakdown_type}/{ano}/totais",
    response_model=DespesaBreakdownTotalsResponse,
    summary="Totais de breakdown por item (agregado anual)",
)
async def totais_breakdown(
    breakdown_type: str,
    ano: int,
    db: Session = Depends(get_db),
) -> DespesaBreakdownTotalsResponse:
    """
    Retorna totais agregados por item para um tipo de breakdown e ano.

    Example:
        GET /api/v1/despesas/breakdown/ORGAO/2025/totais
    """
    bt_upper = breakdown_type.upper()
    if bt_upper not in _VALID_BREAKDOWN_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido: {breakdown_type}. Use ORGAO, FUNCAO, ELEMENTO ou NATUREZA.",
        )

    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    repo = SQLDespesaBreakdownRepository(db)
    items = repo.get_totals_by_item(bt_upper, ano)

    return DespesaBreakdownTotalsResponse(
        breakdown_type=bt_upper,
        ano=ano,
        items=items,
        total_items=len(items),
    )


@router.get(
    "/breakdown/{breakdown_type}/anos",
    response_model=list[int],
    summary="Anos disponíveis para breakdown",
)
async def anos_disponiveis_breakdown(
    breakdown_type: str,
    db: Session = Depends(get_db),
) -> list[int]:
    """
    Retorna anos com dados disponíveis para um tipo de breakdown.

    Example:
        GET /api/v1/despesas/breakdown/ORGAO/anos
    """
    bt_upper = breakdown_type.upper()
    if bt_upper not in _VALID_BREAKDOWN_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido: {breakdown_type}. Use ORGAO, FUNCAO, ELEMENTO ou NATUREZA.",
        )

    repo = SQLDespesaBreakdownRepository(db)
    return repo.get_available_years(bt_upper)
