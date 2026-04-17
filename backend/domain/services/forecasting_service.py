"""
Serviço de forecasting com Prophet.
Dashboard Financeiro - Bandeirantes MS

Prevê receitas e despesas futuras baseado em dados históricos.
"""

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.infrastructure.database.models import DespesaModel, ReceitaModel

logger = logging.getLogger(__name__)


class ForecastResult:
    """Resultado de uma previsão."""

    def __init__(
        self,
        data: date,
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


class ForecastingService:
    """
    Serviço de previsão financeira usando Prophet.

    Prevê receitas e despesas futuras baseado em dados históricos
    do município de Bandeirantes MS.
    """

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _remove_partial_current_month(
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

    def forecast_receitas(
        self,
        horizonte_meses: int = 12,
        nivel_confianca: float = 0.95,
    ) -> list[ForecastResult]:
        """
        Prevê receitas para os próximos N meses.

        Args:
            horizonte_meses: Número de meses a prever
            nivel_confianca: Nível de confiança (0.80, 0.90, 0.95)

        Returns:
            Lista de previsões com intervalos de confiança
        """
        # Buscar dados históricos
        dados_historicos = self._get_receitas_mensais()

        dados_historicos = self._remove_partial_current_month(dados_historicos)

        if len(dados_historicos) < 24:
            # Se não houver dados suficientes, usar projeção linear
            return self._projecao_linear(dados_historicos, horizonte_meses)

        try:
            # Preparar dados para Prophet
            df = pd.DataFrame(dados_historicos, columns=["ds", "y"])

            # Criar e treinar modelo
            modelo = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=nivel_confianca,
                changepoint_prior_scale=0.05,
            )

            # Adicionar sazonalidade mensal
            modelo.add_seasonality(name="monthly", period=30.5, fourier_order=5)

            # Treinar
            modelo.fit(df)

            # Gerar datas futuras
            futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="MS")

            # Prever
            previsao = modelo.predict(futuro)

            # Filtrar apenas previsões futuras
            ultima_data = df["ds"].max()
            previsoes_futuras = previsao[previsao["ds"] > ultima_data]

            # Converter para resultado
            resultados = []
            for _, row in previsoes_futuras.iterrows():
                valor = max(0, row["yhat"])  # Receitas não podem ser negativas
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
                "Falha ao gerar forecast de receitas com Prophet; aplicando fallback linear"
            )
            return self._projecao_linear(dados_historicos, horizonte_meses)

    def forecast_despesas(
        self,
        horizonte_meses: int = 12,
        nivel_confianca: float = 0.95,
    ) -> list[ForecastResult]:
        """
        Prevê despesas para os próximos N meses.

        Args:
            horizonte_meses: Número de meses a prever
            nivel_confianca: Nível de confiança (0.80, 0.90, 0.95)

        Returns:
            Lista de previsões com intervalos de confiança
        """
        # Buscar dados históricos
        dados_historicos = self._get_despesas_mensais()

        dados_historicos = self._remove_partial_current_month(dados_historicos)

        if len(dados_historicos) < 24:
            # Se não houver dados suficientes, usar projeção linear
            return self._projecao_linear(dados_historicos, horizonte_meses)

        try:
            # Preparar dados para Prophet
            df = pd.DataFrame(dados_historicos, columns=["ds", "y"])

            # Criar e treinar modelo
            modelo = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=nivel_confianca,
                changepoint_prior_scale=0.05,
            )

            # Adicionar sazonalidade mensal
            modelo.add_seasonality(name="monthly", period=30.5, fourier_order=5)

            # Treinar
            modelo.fit(df)

            # Gerar datas futuras
            futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="MS")

            # Prever
            previsao = modelo.predict(futuro)

            # Filtrar apenas previsões futuras
            ultima_data = df["ds"].max()
            previsoes_futuras = previsao[previsao["ds"] > ultima_data]

            # Converter para resultado
            resultados = []
            for _, row in previsoes_futuras.iterrows():
                valor = max(0, row["yhat"])  # Despesas não podem ser negativas
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
                "Falha ao gerar forecast de despesas com Prophet; aplicando fallback linear"
            )
            return self._projecao_linear(dados_historicos, horizonte_meses)

    def _get_receitas_mensais(self) -> list[tuple[datetime, float]]:
        """
        Busca receitas mensais históricas do banco de dados.

        Returns:
            Lista de tuplas (data, valor)
        """
        resultados = (
            self.db.query(
                ReceitaModel.ano.label("ano"),
                ReceitaModel.mes.label("mes"),
                func.sum(ReceitaModel.valor_arrecadado).label("valor"),
            )
            .filter(ReceitaModel.mes >= 1, ReceitaModel.mes <= 12)
            .group_by(ReceitaModel.ano, ReceitaModel.mes)
            .order_by(ReceitaModel.ano, ReceitaModel.mes)
            .all()
        )

        # Converter para lista de tuplas (datetime, float)
        dados: list[tuple[datetime, float]] = []
        for r in resultados:
            if r.ano and r.mes and r.valor is not None:
                ano = int(r.ano)
                mes = int(r.mes)
                data = datetime(ano, mes, 1)
                valor = float(r.valor)
                dados.append((data, valor))

        return dados

    def _get_despesas_mensais(self) -> list[tuple[datetime, float]]:
        """
        Busca despesas mensais históricas do banco de dados.

        Returns:
            Lista de tuplas (data, valor)
        """
        resultados = (
            self.db.query(
                DespesaModel.ano.label("ano"),
                DespesaModel.mes.label("mes"),
                func.sum(DespesaModel.valor_pago).label("valor"),
            )
            .filter(DespesaModel.mes >= 1, DespesaModel.mes <= 12)
            .group_by(DespesaModel.ano, DespesaModel.mes)
            .order_by(DespesaModel.ano, DespesaModel.mes)
            .all()
        )

        # Converter para lista de tuplas (datetime, float)
        dados: list[tuple[datetime, float]] = []
        for r in resultados:
            if r.ano and r.mes and r.valor is not None:
                ano = int(r.ano)
                mes = int(r.mes)
                data = datetime(ano, mes, 1)
                valor = float(r.valor)
                dados.append((data, valor))

        return dados

    def _projecao_linear(
        self,
        dados_historicos: list[tuple[datetime, float]],
        horizonte_meses: int,
    ) -> list[ForecastResult]:
        """
        Faz projeção linear simples quando não há dados suficientes para Prophet.

        Args:
            dados_historicos: Dados históricos (data, valor)
            horizonte_meses: Número de meses a prever

        Returns:
            Lista de previsões
        """
        if not dados_historicos:
            return []

        # Extrair valores
        valores = [v for _, v in dados_historicos]

        # Calcular média e desvio padrão
        media = np.mean(valores)
        desvio = np.std(valores) if len(valores) > 1 else media * 0.1

        # Calcular tendência
        if len(valores) > 1:
            x = np.arange(len(valores))
            coef = np.polyfit(x, valores, 1)
            tendencia_coef = coef[0]
        else:
            tendencia_coef = 0

        # Gerar previsões
        ultima_data = dados_historicos[-1][0]
        resultados = []

        for i in range(1, horizonte_meses + 1):
            # Calcular data futura
            mes = ultima_data.month + i
            ano = ultima_data.year + (mes - 1) // 12
            mes = ((mes - 1) % 12) + 1
            data_futura = datetime(ano, mes, 1).date()

            # Calcular valor previsto
            valor_previsto = media + tendencia_coef * (len(valores) + i)
            valor_previsto = max(0, valor_previsto)

            # Intervalo de confiança (± 1 desvio padrão)
            intervalo_inferior = max(0, valor_previsto - desvio)
            intervalo_superior = valor_previsto + desvio

            # Tendência
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


# Removido alias redundante - classe já definida acima
