"""
Serviço de forecasting com Prophet.
Dashboard Financeiro - Bandeirantes MS

Prevê receitas e despesas futuras baseado em dados históricos.
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from decimal import Decimal
import pandas as pd
import numpy as np
from prophet import Prophet
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.infrastructure.database.models import ReceitaModel, DespesaModel


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

    def to_dict(self) -> Dict[str, Any]:
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

    def forecast_receitas(
        self,
        horizonte_meses: int = 12,
        nivel_confianca: float = 0.95,
    ) -> List[ForecastResult]:
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

        if len(dados_historicos) < 24:
            # Se não houver dados suficientes, usar projeção linear
            return self._projecao_linear(dados_historicos, horizonte_meses)

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
        futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="M")

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
                FcastResult(
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

    def forecast_despesas(
        self,
        horizonte_meses: int = 12,
        nivel_confianca: float = 0.95,
    ) -> List[ForecastResult]:
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

        if len(dados_historicos) < 24:
            # Se não houver dados suficientes, usar projeção linear
            return self._projecao_linear(dados_historicos, horizonte_meses)

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
        futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="M")

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

    def _get_receitas_mensais(self) -> List[tuple]:
        """
        Busca receitas mensais históricas do banco de dados.

        Returns:
            Lista de tuplas (data, valor)
        """
        resultados = (
            self.db.query(
                func.strftime(
                    "%Y-%m-01",
                    func.strftime("%d", ReceitaModel.ano)
                    + "-"
                    + func.strftime("%m", ReceitaModel.mes)
                    + "-01",
                ).label("data"),
                func.sum(ReceitaModel.valor_arrecadado).label("valor"),
            )
            .group_by("data")
            .order_by("data")
            .all()
        )

        # Converter para lista de tuplas (datetime, float)
        dados = []
        for r in resultados:
            if r.data and r.valor:
                ano = int(r.data[:4])
                mes = int(r.data[5:7])
                data = datetime(ano, mes, 1)
                valor = float(r.valor)
                dados.append((data, valor))

        return dados

    def _get_despesas_mensais(self) -> List[tuple]:
        """
        Busca despesas mensais históricas do banco de dados.

        Returns:
            Lista de tuplas (data, valor)
        """
        resultados = (
            self.db.query(
                func.strftime(
                    "%Y-%m-01",
                    func.strftime("%d", DespesaModel.ano)
                    + "-"
                    + func.strftime("%m", DespesaModel.mes)
                    + "-01",
                ).label("data"),
                func.sum(DespesaModel.valor_pago).label("valor"),
            )
            .group_by("data")
            .order_by("data")
            .all()
        )

        # Converter para lista de tuplas (datetime, float)
        dados = []
        for r in resultados:
            if r.data and r.valor:
                ano = int(r.data[:4])
                mes = int(r.data[5:7])
                data = datetime(ano, mes, 1)
                valor = float(r.valor)
                dados.append((data, valor))

        return dados

    def _projecao_linear(
        self, dados_historicos: List[tuple], horizonte_meses: int
    ) -> List[ForecastResult]:
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
