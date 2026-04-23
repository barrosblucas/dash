"""
Serviço de forecasting com Prophet — lógica de domínio pura.

Dashboard Financeiro - Bandeirantes MS

Prevê receitas e despesas futuras baseado em dados históricos.
Camada de domínio: SEM SQLAlchemy, SEM Session, SEM Model imports.
Recebe dados primitivos (listas de tuplas) e retorna previsões.
"""

from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)


class ForecastResult:
    """Resultado de uma previsão."""

    def __init__(
        self,
        data: Any,
        valor_previsto: Decimal,
        intervalo_inferior: Decimal,
        intervalo_superior: Decimal,
        tendencia: str,
    ):
        self.data = data
        self.valor_previsto = valor_previsto
        self.intervalo_inferior = intervalo_inferior
        self.intervalo_superior = intervalo_superior
        self.tendencia = tendencia

    def to_dict(self) -> dict[str, Any]:
        return {
            "data": self.data.isoformat(),
            "valor_previsto": float(self.valor_previsto),
            "intervalo_inferior": float(self.intervalo_inferior),
            "intervalo_superior": float(self.intervalo_superior),
            "tendencia": self.tendencia,
        }


def remove_partial_current_month(
    dados_historicos: list[tuple[datetime, float]],
) -> list[tuple[datetime, float]]:
    """Remove o mês corrente para evitar viés por dados parciais."""
    if not dados_historicos:
        return []

    now = datetime.now()
    filtrados = [
        (data, valor)
        for data, valor in dados_historicos
        if not (data.year == now.year and data.month == now.month)
    ]

    # Em cenários extremos, mantém histórico original para evitar série vazia.
    return filtrados or dados_historicos


def run_prophet_forecast(
    dados_historicos: list[tuple[datetime, float]],
    horizonte_meses: int = 12,
    nivel_confianca: float = 0.95,
) -> list[ForecastResult]:
    """
    Executa previsão usando Prophet (ou fallback linear).

    Recebe dados históricos como lista de tuplas (datetime, valor).
    Não acessa banco de dados — lógica de domínio pura.

    Args:
        dados_historicos: Série temporal de entrada (data, valor).
        horizonte_meses: Número de meses a prever.
        nivel_confianca: Nível de confiança (0.80, 0.90, 0.95).

    Returns:
        Lista de previsões com intervalos de confiança.
    """
    dados_historicos = remove_partial_current_month(dados_historicos)

    if len(dados_historicos) < 24:
        return projecao_linear(dados_historicos, horizonte_meses)

    try:
        df = pd.DataFrame(dados_historicos, columns=["ds", "y"])

        modelo = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            interval_width=nivel_confianca,
            changepoint_prior_scale=0.05,
        )

        modelo.add_seasonality(name="monthly", period=30.5, fourier_order=5)

        modelo.fit(df)

        futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="MS")

        previsao = modelo.predict(futuro)

        ultima_data = df["ds"].max()
        previsoes_futuras = previsao[previsao["ds"] > ultima_data]

        resultados = []
        for _, row in previsoes_futuras.iterrows():
            valor = max(0, row["yhat"])
            tendencia = (
                "alta"
                if row["trend"] > 0
                else "baixa"
                if row["trend"] < 0
                else "estavel"
            )

            resultados.append(
                ForecastResult(
                    data=row["ds"].date(),
                    valor_previsto=Decimal(str(round(valor, 2))),
                    intervalo_inferior=Decimal(
                        str(round(max(0, row["yhat_lower"]), 2))
                    ),
                    intervalo_superior=Decimal(str(round(row["yhat_upper"], 2))),
                    tendencia=tendencia,
                )
            )

        return resultados
    except Exception:
        logger.exception(
            "Falha ao gerar forecast com Prophet; aplicando fallback linear"
        )
        return projecao_linear(dados_historicos, horizonte_meses)


def projecao_linear(
    dados_historicos: list[tuple[datetime, float]],
    horizonte_meses: int,
) -> list[ForecastResult]:
    """
    Faz projeção linear simples quando não há dados suficientes para Prophet.

    Args:
        dados_historicos: Dados históricos (data, valor).
        horizonte_meses: Número de meses a prever.

    Returns:
        Lista de previsões.
    """
    if not dados_historicos:
        return []

    valores = [v for _, v in dados_historicos]

    media = np.mean(valores)
    desvio = np.std(valores) if len(valores) > 1 else media * 0.1

    if len(valores) > 1:
        x = np.arange(len(valores))
        coef = np.polyfit(x, valores, 1)
        tendencia_coef = coef[0]
    else:
        tendencia_coef = 0

    ultima_data = dados_historicos[-1][0]
    resultados = []

    for i in range(1, horizonte_meses + 1):
        mes = ultima_data.month + i
        ano = ultima_data.year + (mes - 1) // 12
        mes = ((mes - 1) % 12) + 1
        data_futura = datetime(ano, mes, 1).date()

        valor_previsto = media + tendencia_coef * (len(valores) + i)
        valor_previsto = max(0, valor_previsto)

        intervalo_inferior = max(0, valor_previsto - desvio)
        intervalo_superior = valor_previsto + desvio

        tendencia = (
            "alta"
            if tendencia_coef > 0
            else "baixa"
            if tendencia_coef < 0
            else "estavel"
        )

        resultados.append(
            ForecastResult(
                data=data_futura,
                valor_previsto=Decimal(str(round(valor_previsto, 2))),
                intervalo_inferior=Decimal(str(round(intervalo_inferior, 2))),
                intervalo_superior=Decimal(str(round(intervalo_superior, 2))),
                tendencia=tendencia,
            )
        )

    return resultados
