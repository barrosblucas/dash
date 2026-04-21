"""
Rotas da API para forecasting.
Dashboard Financeiro - Bandeirantes MS

Prevê receitas e despesas futuras.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.api.schemas_forecast import ForecastResponse, ForecastPoint
from backend.infrastructure.database.connection import get_db
from backend.domain.services.forecasting_service import ForecastingService

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get(
    "/receitas", response_model=ForecastResponse, summary="Previsão de receitas"
)
async def forecast_receitas(
    horizonte: Optional[int] = Query(
        12, ge=1, le=72, description="Número de meses a prever (1-72)"
    ),
    confianca: Optional[float] = Query(
        0.95, ge=0.80, le=0.99, description="Nível de confiança (0.80-0.99)"
    ),
    db: Session = Depends(get_db),
):
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
    service = ForecastingService(db)
    previsoes = service.forecast_receitas(
        horizonte_meses=horizonte,
        nivel_confianca=confianca,
    )

    return ForecastResponse(
        tipo="receitas",
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
    "/despesas", response_model=ForecastResponse, summary="Previsão de despesas"
)
async def forecast_despesas(
    horizonte: Optional[int] = Query(
        12, ge=1, le=72, description="Número de meses a prever (1-72)"
    ),
    confianca: Optional[float] = Query(
        0.95, ge=0.80, le=0.99, description="Nível de confiança (0.80-0.99)"
    ),
    db: Session = Depends(get_db),
):
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
    service = ForecastingService(db)
    previsoes = service.forecast_despesas(
        horizonte_meses=horizonte,
        nivel_confianca=confianca,
    )

    return ForecastResponse(
        tipo="despesas",
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
