"""Testes do serviço de forecast financeiro."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace
from typing import Any

import pandas as pd
import pytest

from backend.features.forecast.forecast_business import (
    ForecastResult,
    run_prophet_forecast,
)
from backend.features.forecast.forecast_data import (
    get_despesas_mensais,
    get_receitas_mensais,
)


class _FakeProphet:
    """Fake do Prophet para validar o dataframe de treino."""

    last_fit_df: pd.DataFrame | None = None

    def __init__(self, **_: Any) -> None:
        self._history_df: pd.DataFrame | None = None

    def add_seasonality(self, **_: Any) -> None:
        return None

    def fit(self, df: pd.DataFrame) -> None:
        self._history_df = df.copy()
        _FakeProphet.last_fit_df = df.copy()

    def make_future_dataframe(self, periods: int, freq: str) -> pd.DataFrame:
        if self._history_df is None:
            raise AssertionError("fit() deve ser chamado antes")
        if freq not in {"M", "MS"}:
            raise AssertionError("freq inesperado")
        ultima_data = self._history_df["ds"].max()
        datas = pd.date_range(ultima_data, periods=periods + 1, freq="MS")
        return pd.DataFrame({"ds": datas})

    def predict(self, future: pd.DataFrame) -> pd.DataFrame:
        resultado = future.copy()
        resultado["yhat"] = 1000.0
        resultado["yhat_lower"] = 900.0
        resultado["yhat_upper"] = 1100.0
        resultado["trend"] = 1.0
        return resultado


class _BrokenProphet:
    def __init__(self, **_: Any) -> None:
        raise RuntimeError("stan backend indisponivel")


def _month_start(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, 1)


def _shift_month(dt: datetime, delta: int) -> datetime:
    month_index = dt.year * 12 + (dt.month - 1) + delta
    year = month_index // 12
    month = month_index % 12 + 1
    return datetime(year, month, 1)


def _build_series_with_current_partial(total_months: int) -> list[tuple[datetime, float]]:
    now = datetime.now()
    current_month = _month_start(now)
    series: list[tuple[datetime, float]] = []

    for i in range(total_months):
        data = _shift_month(current_month, -(total_months - 1 - i))
        valor = float(1000 + i * 10)
        series.append((data, valor))

    # Simula mês corrente parcial para reproduzir viés para baixo
    series[-1] = (current_month, 1.0)
    return series


def test_forecast_receitas_descarta_mes_corrente_parcial_no_treino(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    historical = _build_series_with_current_partial(total_months=30)

    monkeypatch.setattr(
        "backend.features.forecast.forecast_business.Prophet", _FakeProphet
    )

    resultados = run_prophet_forecast(
        dados_historicos=historical,
        horizonte_meses=3,
        nivel_confianca=0.95,
    )

    assert len(resultados) == 3
    fit_df = _FakeProphet.last_fit_df
    assert fit_df is not None

    ultima_data_treino = fit_df["ds"].max().to_pydatetime()
    now = datetime.now()
    assert (ultima_data_treino.year, ultima_data_treino.month) != (now.year, now.month)


def test_forecast_receitas_fallback_linear_apos_remover_mes_parcial(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    historical = _build_series_with_current_partial(total_months=24)
    captured: dict[str, Any] = {}

    def fake_linear(
        dados_historicos: list[tuple[datetime, float]], horizonte_meses: int
    ) -> list[ForecastResult]:
        captured["size"] = len(dados_historicos)
        captured["horizonte"] = horizonte_meses
        return [
            ForecastResult(
                data=date(2026, 5, 1),
                valor_previsto=Decimal("10"),
                intervalo_inferior=Decimal("9"),
                intervalo_superior=Decimal("11"),
                tendencia="alta",
            )
        ]

    monkeypatch.setattr(
        "backend.features.forecast.forecast_business.projecao_linear", fake_linear
    )

    resultados = run_prophet_forecast(
        dados_historicos=historical,
        horizonte_meses=5,
        nivel_confianca=0.95,
    )

    assert captured["size"] == 23
    assert captured["horizonte"] == 5
    assert resultados[0].valor_previsto == Decimal("10")


def test_forecast_receitas_fallback_linear_quando_prophet_falha(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    historical = _build_series_with_current_partial(total_months=30)
    captured: dict[str, Any] = {}

    monkeypatch.setattr(
        "backend.features.forecast.forecast_business.Prophet", _BrokenProphet
    )

    def fake_linear(
        dados_historicos: list[tuple[datetime, float]], horizonte_meses: int
    ) -> list[ForecastResult]:
        captured["size"] = len(dados_historicos)
        captured["horizonte"] = horizonte_meses
        return [
            ForecastResult(
                data=date(2026, 6, 1),
                valor_previsto=Decimal("20"),
                intervalo_inferior=Decimal("18"),
                intervalo_superior=Decimal("22"),
                tendencia="alta",
            )
        ]

    monkeypatch.setattr(
        "backend.features.forecast.forecast_business.projecao_linear", fake_linear
    )

    resultados = run_prophet_forecast(
        dados_historicos=historical,
        horizonte_meses=4,
        nivel_confianca=0.95,
    )

    assert captured["size"] >= 24
    assert captured["horizonte"] == 4
    assert resultados[0].valor_previsto == Decimal("20")


class _FakeQuery:
    def __init__(self, rows: list[Any]):
        self._rows = rows

    def filter(self, *_: Any, **__: Any) -> _FakeQuery:
        return self

    def group_by(self, *_: Any) -> _FakeQuery:
        return self

    def order_by(self, *_: Any) -> _FakeQuery:
        return self

    def all(self) -> list[Any]:
        return self._rows


class _FakeDB:
    def __init__(self, rows: list[Any]):
        self._rows = rows

    def query(self, *_: Any) -> _FakeQuery:
        return _FakeQuery(self._rows)


def test_get_receitas_mensais_converte_ano_mes_para_datetime() -> None:
    rows = [
        SimpleNamespace(ano=2025, mes=12, valor=Decimal("123.45")),
        SimpleNamespace(ano=2026, mes=1, valor=Decimal("456.78")),
    ]
    dados = get_receitas_mensais(_FakeDB(rows))

    assert dados == [
        (datetime(2025, 12, 1), 123.45),
        (datetime(2026, 1, 1), 456.78),
    ]


def test_get_despesas_mensais_converte_ano_mes_para_datetime() -> None:
    rows = [
        SimpleNamespace(ano=2025, mes=12, valor=Decimal("222.22")),
        SimpleNamespace(ano=2026, mes=1, valor=Decimal("333.33")),
    ]
    dados = get_despesas_mensais(_FakeDB(rows))

    assert dados == [
        (datetime(2025, 12, 1), 222.22),
        (datetime(2026, 1, 1), 333.33),
    ]
