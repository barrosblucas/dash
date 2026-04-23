"""
Rotas da API para forecasting.
Dashboard Financeiro - Bandeirantes MS

Prevê receitas e despesas futuras.
Orquestra: forecast_data (DB) → forecast_business (domínio puro).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.forecast.forecast_business import (
    ForecastResult,
    run_prophet_forecast,
)
from backend.features.forecast.forecast_data import (
    get_despesas_mensais,
    get_receitas_mensais,
)
from backend.features.forecast.forecast_types import ForecastPoint, ForecastResponse
from backend.shared.database.connection import get_db

router = APIRouter(prefix="/forecast", tags=["forecast"])


def _build_response(
    tipo: str,
    horizonte: int,
    confianca: float,
    previsoes: list[ForecastResult],
) -> ForecastResponse:
    return ForecastResponse(
        tipo=tipo,
        horizonte_meses=horizonte,
        nivel_confianca=confianca,
        previsoes=[
            ForecastPoint(
                data=p.data,
                valor_previsto=p.valor_previsto,
                intervalo_inferior=p.intervalo_inferior,
                intervalo_superior=p.intervalo_superior,
                tendencia=p.tendencia,
            )
            for p in previsoes
        ],
    )


@router.get(
    "/receitas", response_model=ForecastResponse, summary="Previsão de receitas"
)
async def forecast_receitas(
    horizonte: int | None = Query(
        12, ge=1, le=72, description="Número de meses a prever (1-72)"
    ),
    confianca: float | None = Query(
        0.95, ge=0.80, le=0.99, description="Nível de confiança (0.80-0.99)"
    ),
    db: Session = Depends(get_db),
) -> ForecastResponse:
    """
    Prevê receitas para os próximos N meses usando Prophet.

    Utiliza dados históricos de receitas para treinar um modelo de
    previsão com sazonalidade anual e mensal.

    Args:
        horizonte: Número de meses a prever (padrão: 12)
        confianca: Nível de confiança para intervalos (padrão: 0.95)
        db: Sessão do banco de dados injetada.

    Returns:
        Previsões com intervalos de confiança e tendência.

    Example:
        GET /api/v1/forecast/receitas?horizonte=24&confianca=0.90
    """
    assert horizonte is not None
    assert confianca is not None
    dados_historicos = get_receitas_mensais(db)
    previsoes = run_prophet_forecast(
        dados_historicos=dados_historicos,
        horizonte_meses=horizonte,
        nivel_confianca=confianca,
    )
    return _build_response("receitas", horizonte, confianca, previsoes)


@router.get(
    "/despesas", response_model=ForecastResponse, summary="Previsão de despesas"
)
async def forecast_despesas(
    horizonte: int | None = Query(
        12, ge=1, le=72, description="Número de meses a prever (1-72)"
    ),
    confianca: float | None = Query(
        0.95, ge=0.80, le=0.99, description="Nível de confiança (0.80-0.99)"
    ),
    db: Session = Depends(get_db),
) -> ForecastResponse:
    """
    Prevê despesas para os próximos N meses usando Prophet.

    Utiliza dados históricos de despesas para treinar um modelo de
    previsão com sazonalidade anual e mensal.

    Args:
        horizonte: Número de meses a prever (padrão: 12)
        confianca: Nível de confiança para intervalos (padrão: 0.95)
        db: Sessão do banco de dados injetada.

    Returns:
        Previsões com intervalos de confiança e tendência.

    Example:
        GET /api/v1/forecast/despesas?horizonte=24&confianca=0.90
    """
    assert horizonte is not None
    assert confianca is not None
    dados_historicos = get_despesas_mensais(db)
    previsoes = run_prophet_forecast(
        dados_historicos=dados_historicos,
        horizonte_meses=horizonte,
        nivel_confianca=confianca,
    )
    return _build_response("despesas", horizonte, confianca, previsoes)
