"""
Forecast bounded context — types and schemas.

Consolidates:
  - api/schemas_forecast.py (Pydantic schemas)
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ForecastPoint(BaseModel):
    """Schema para um ponto de previsão."""

    data: date = Field(..., description="Data da previsão")
    valor_previsto: Decimal = Field(..., description="Valor previsto")
    intervalo_inferior: Decimal = Field(
        ..., description="Intervalo inferior de confiança"
    )
    intervalo_superior: Decimal = Field(
        ..., description="Intervalo superior de confiança"
    )
    tendencia: str = Field(..., description="Tendência: 'alta', 'baixa' ou 'estavel'")


class ForecastResponse(BaseModel):
    """Schema de resposta para forecasting."""

    tipo: str = Field(..., description="Tipo: 'receitas' ou 'despesas'")
    horizonte_meses: int = Field(..., description="Número de meses previstos")
    nivel_confianca: float = Field(..., description="Nível de confiança (0-1)")
    previsoes: list[ForecastPoint] = Field(..., description="Lista de previsões")
