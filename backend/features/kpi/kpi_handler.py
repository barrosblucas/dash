"""
Rotas da API para KPIs (Key Performance Indicators).

Endpoints para consulta de indicadores financeiros.
Apenas orquestração HTTP — delega para data e business.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.features.kpi.kpi_business import (
    calcular_kpis_anuais,
    calcular_kpis_mensais,
    calcular_kpis_periodo,
)
from backend.features.kpi.kpi_data import (
    get_ano_mais_recente,
    get_resumo_geral,
    get_totais_anuais,
    get_totais_mensais,
    get_totais_por_ano_tipo,
)
from backend.features.kpi.kpi_types import KPIsResponse
from backend.shared.database.connection import get_db

router = APIRouter(prefix="/kpis", tags=["kpis"])


@router.get("", response_model=KPIsResponse, summary="KPIs principais")
async def obter_kpis(
    ano: int | None = Query(
        None, ge=2013, le=2030, description="Ano para cálculo dos KPIs"
    ),
    db: Session = Depends(get_db),
) -> KPIsResponse:
    """
    Obtém os principais KPIs financeiros.

    Retorna indicadores financeiros consolidados por ano ou mês.
    Se nenhum ano for especificado, retorna o ano mais recente.

    Example:
        GET /api/v1/kpis/
        GET /api/v1/kpis/?ano=2023
    """
    if ano is None:
        ano = get_ano_mais_recente(db)

    total_receitas, total_despesas, total_previsto, total_empenhado = get_totais_anuais(
        db, ano
    )

    return calcular_kpis_anuais(
        total_receitas, total_despesas, total_previsto, total_empenhado, ano
    )


@router.get("/mensal/{ano}", response_model=KPIsResponse, summary="KPIs mensais")
async def obter_kpis_mensal(
    ano: int,
    db: Session = Depends(get_db),
) -> KPIsResponse:
    """
    Obtém KPIs financeiros por mês do ano.

    Retorna indicadores financeiros calculados para cada mês do ano.

    Example:
        GET /api/v1/kpis/mensal/2023
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    raw = get_totais_mensais(db, ano)

    return calcular_kpis_mensais(raw.receitas_mensais, raw.despesas_mensais, ano)


@router.get("/anual", response_model=KPIsResponse, summary="KPIs anuais")
async def obter_kpis_anuais(
    ano_inicio: int | None = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: int | None = Query(None, ge=2013, le=2030, description="Ano final"),
    db: Session = Depends(get_db),
) -> KPIsResponse:
    """
    Obtém KPIs financeiros por ano.

    Retorna indicadores financeiros calculados para cada ano no período.

    Example:
        GET /api/v1/kpis/anual/
        GET /api/v1/kpis/anual/?ano_inicio=2020&ano_fim=2023
    """
    if ano_inicio is None:
        ano_inicio = 2016

    if ano_fim is None:
        ano_fim = 2026

    if ano_inicio > ano_fim:
        raise HTTPException(
            status_code=400, detail="ano_inicio não pode ser maior que ano_fim"
        )

    raw = get_totais_por_ano_tipo(db, ano_inicio, ano_fim)

    return calcular_kpis_periodo(
        raw.receitas_por_ano_tipo,
        raw.despesas_por_ano_tipo,
        ano_inicio,
        ano_fim,
    )


@router.get("/resumo", response_model=dict, summary="Resumo geral")
async def obter_resumo_geral(db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Obtém resumo geral dos dados financeiros.

    Retorna estatísticas gerais do banco de dados como quantidade de registros,
    anos disponíveis, etc.

    Example:
        GET /api/v1/kpis/resumo/
    """
    return get_resumo_geral(db)
