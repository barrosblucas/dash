"""Normalização de snapshots da feature saude."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Any

from backend.features.saude.saude_types import (
    SaudeHospitalCensoResponse,
    SaudeLabelValueItem,
    SaudeLabelValueTrendItem,
    SaudeMonthlySeriesItem,
    SaudeSeriesItem,
    SaudeTrendDirection,
)


def max_synced_at(*timestamps: datetime | None) -> datetime | None:
    values = [item for item in timestamps if item is not None]
    return max(values) if values else None


def chart_to_label_value_items(payload: Any) -> list[SaudeLabelValueItem]:
    series = chart_to_series_items(payload)
    if not series:
        return []
    return [
        SaudeLabelValueItem(label=item.label, value=item.value)
        for item in series[0].points
    ]


def chart_to_monthly_series_items(
    payload: Any,
    *,
    year: int | None = None,
) -> list[SaudeMonthlySeriesItem]:
    series = chart_to_series_items(payload, year=year)
    if not series:
        return []
    return series[0].points


def chart_to_series_items(
    payload: Any,
    *,
    year: int | None = None,
) -> list[SaudeSeriesItem]:
    labels = payload.get("labels") if isinstance(payload, dict) else None
    datasets = payload.get("datasets") if isinstance(payload, dict) else None
    if not isinstance(labels, list) or not isinstance(datasets, list):
        return []
    series_items: list[SaudeSeriesItem] = []
    for index, dataset in enumerate(datasets, start=1):
        if not isinstance(dataset, dict):
            continue
        data = dataset.get("data")
        if not isinstance(data, list):
            continue
        points = [
            SaudeMonthlySeriesItem(label=str(label), value=_coerce_int(value))
            for label, value in zip(labels, data, strict=False)
            if year is None or str(year) in str(label)
        ]
        if not points:
            continue
        series_items.append(
            SaudeSeriesItem(
                label=str(dataset.get("label") or f"Serie {index}"),
                points=points,
            )
        )
    return series_items


def quantitativos_to_items_with_trend(
    current_payload: Any,
    previous_payload: Any | None,
) -> list[SaudeLabelValueTrendItem]:
    current_quantitativos = _quantitativos_payload(current_payload)
    previous_quantitativos = _quantitativos_payload(previous_payload)
    items: list[SaudeLabelValueTrendItem] = []
    for key, item in current_quantitativos.items():
        value = _coerce_int(item.get("valor"))
        previous = previous_quantitativos.get(key)
        previous_value = (
            _coerce_int(previous.get("valor")) if isinstance(previous, dict) else None
        )
        items.append(
            SaudeLabelValueTrendItem(
                label=str(item.get("titulo") or "Sem título"),
                value=value,
                previous_value=previous_value,
                trend=_trend_direction(value, previous_value),
            )
        )
    return items


def quantitativos_to_gender_items(payload: Any) -> list[SaudeLabelValueItem]:
    quantitativos = _quantitativos_payload(payload)
    women = quantitativos.get("quantitativo_mulheres")
    men = quantitativos.get("quantitativo_homens")
    items: list[SaudeLabelValueItem] = []
    if isinstance(women, dict):
        items.append(
            SaudeLabelValueItem(
                label=str(women.get("titulo") or "Mulheres"),
                value=_coerce_int(women.get("valor")),
            )
        )
    if isinstance(men, dict):
        items.append(
            SaudeLabelValueItem(
                label=str(men.get("titulo") or "Homens"),
                value=_coerce_int(men.get("valor")),
            )
        )
    return items


def hospital_censo_from_payload(payload: Any) -> SaudeHospitalCensoResponse | None:
    if not isinstance(payload, dict):
        return None
    total_leitos = _first_int(payload, "total_leitos", "total", "leitos_total")
    ocupados = _first_int(payload, "ocupados", "leitos_ocupados", "total_ocupados")
    livres = _first_int(payload, "livres", "leitos_livres", "total_livres")
    taxa_ocupacao = _first_float(
        payload,
        "taxa_ocupacao",
        "ocupacao",
        "taxa_de_ocupacao",
    )
    if taxa_ocupacao is None and total_leitos and ocupados is not None and total_leitos > 0:
        taxa_ocupacao = round((ocupados / total_leitos) * 100, 2)
    return SaudeHospitalCensoResponse(
        total_leitos=total_leitos,
        ocupados=ocupados,
        livres=livres,
        taxa_ocupacao=taxa_ocupacao,
        raw=_dict_payload(payload),
    )


def hospital_table_to_items(payload: Any) -> tuple[list[SaudeLabelValueItem], int]:
    if not isinstance(payload, dict):
        return [], 0
    rows = payload.get("data")
    if not isinstance(rows, list):
        return [], 0

    items: list[SaudeLabelValueItem] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        label = str(
            row.get("procedimento")
            or row.get("descricao")
            or row.get("nome")
            or row.get("label")
            or "Sem descrição"
        ).strip()
        value = _coerce_int(
            row.get("quantidade")
            or row.get("total")
            or row.get("value")
            or row.get("valor")
        )
        items.append(SaudeLabelValueItem(label=label, value=value))

    total = _coerce_int_or_none(payload.get("total"))
    return items, total if total is not None else len(items)


def sum_values(items: Sequence[SaudeMonthlySeriesItem | SaudeLabelValueItem]) -> int:
    return sum(item.value for item in items)


def filter_monthly_series_by_date_range(
    items: list[SaudeMonthlySeriesItem],
    start_date: datetime,
    end_date: datetime,
) -> list[SaudeMonthlySeriesItem]:
    """Filtra série mensal por label que contém ano/mês dentro do range."""
    filtered: list[SaudeMonthlySeriesItem] = []
    for item in items:
        item_date = _parse_monthly_label(item.label)
        if item_date is not None and start_date <= item_date <= end_date:
            filtered.append(item)
    return filtered


_MONTHS_PT = {
    "janeiro": 1,
    "fevereiro": 2,
    "março": 3,
    "marco": 3,
    "abril": 4,
    "maio": 5,
    "junho": 6,
    "julho": 7,
    "agosto": 8,
    "setembro": 9,
    "outubro": 10,
    "novembro": 11,
    "dezembro": 12,
}


def _parse_monthly_label(label: str) -> datetime | None:
    """Tenta extrair ano e mês de labels como 'Jan/2024', '2024-01' ou 'Janeiro de 2024'."""
    import re

    # formato 'Janeiro de 2024' ou 'Fevereiro de 2025'
    ext_match = re.search(r"([a-zA-ZçÇ]+)\s+de\s+(\d{4})", label, re.IGNORECASE)
    if ext_match:
        month_name = ext_match.group(1).lower()
        year = int(ext_match.group(2))
        month = _MONTHS_PT.get(month_name)
        if month:
            try:
                return datetime(year, month, 1)
            except ValueError:
                return None
    # formato 'Jan/2024' ou '01/2024'
    slash_match = re.search(r"(\d{2})/(\d{4})", label)
    if slash_match:
        month = int(slash_match.group(1))
        year = int(slash_match.group(2))
        try:
            return datetime(year, month, 1)
        except ValueError:
            return None
    # formato '2024-01'
    dash_match = re.search(r"(\d{4})-(\d{2})", label)
    if dash_match:
        year = int(dash_match.group(1))
        month = int(dash_match.group(2))
        try:
            return datetime(year, month, 1)
        except ValueError:
            return None
    # formato que contém apenas o ano (ex: '2024') — assume janeiro
    year_only_match = re.search(r"(\d{4})", label)
    if year_only_match:
        year = int(year_only_match.group(1))
        try:
            return datetime(year, 1, 1)
        except ValueError:
            return None
    return None


def _quantitativos_payload(payload: Any) -> dict[str, Any]:
    quantitativos = payload.get("quantitativos") if isinstance(payload, dict) else None
    return quantitativos if isinstance(quantitativos, dict) else {}


def _trend_direction(
    current_value: int,
    previous_value: int | None,
) -> SaudeTrendDirection | None:
    if previous_value is None:
        return None
    if current_value > previous_value:
        return SaudeTrendDirection.UP
    if current_value < previous_value:
        return SaudeTrendDirection.DOWN
    return SaudeTrendDirection.STABLE


def _first_int(payload: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        if key not in payload:
            continue
        value = _coerce_int_or_none(payload.get(key))
        if value is not None:
            return value
    return None


def _first_float(payload: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        if key not in payload:
            continue
        value = _coerce_float_or_none(payload.get(key))
        if value is not None:
            return value
    return None


def _coerce_int(value: Any) -> int:
    return _coerce_int_or_none(value) or 0


def _coerce_int_or_none(value: Any) -> int | None:
    try:
        return int(float(str(value).replace(",", ".")))
    except (AttributeError, TypeError, ValueError):
        return None


def _coerce_float_or_none(value: Any) -> float | None:
    try:
        return float(str(value).replace("%", "").replace(",", "."))
    except (AttributeError, TypeError, ValueError):
        return None


def _dict_payload(payload: Any) -> dict[str, object]:
    if not isinstance(payload, dict):
        return {}
    return {str(key): value for key, value in payload.items()}
