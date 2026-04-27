"""Agregadores e respostas estruturadas da feature saude."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_support import below_minimum
from backend.features.saude.saude_snapshot_mapper import sum_values
from backend.features.saude.saude_types import (
    SaudeAtencaoPrimariaResponse,
    SaudeBucalResponse,
    SaudeFarmaciaResponse,
    SaudeLabelValueItem,
    SaudeMedicamentosDispensadosResponse,
    SaudeMedicationItem,
    SaudeMedicationStockResponse,
    SaudeMonthlySeriesItem,
    SaudeProcedimentosTipoResponse,
    SaudeVacinacaoResponse,
)

_MONTH_NAMES_PT = {
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
}


def resolve_period_bounds(
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    return start_date or date(year, 1, 1), end_date or date(year, 12, 31)


def collect_years_for_period(
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> list[int]:
    effective_start, effective_end = resolve_period_bounds(year, start_date, end_date)
    return list(range(effective_start.year, effective_end.year + 1))


def month_label(year: int, month: int, fallback_label: str | None = None) -> str:
    if fallback_label and str(year) in fallback_label:
        return fallback_label
    month_name = _MONTH_NAMES_PT.get(month)
    if month_name is None:
        return fallback_label or f"{month:02d}/{year}"
    return f"{month_name} de {year}"


def rows_to_monthly_series(rows: list) -> list[SaudeMonthlySeriesItem]:
    return [SaudeMonthlySeriesItem(label=r.label, value=r.quantidade) for r in rows]


def rows_to_label_value(rows: list) -> list[SaudeLabelValueItem]:
    return [
        SaudeLabelValueItem(
            label=r.label,
            value=getattr(r, "quantidade", getattr(r, "valor", 0)),
        )
        for r in rows
    ]


def max_synced_from_rows(*rows: list) -> datetime | None:
    timestamps = [
        row.synced_at
        for sublist in rows
        for row in sublist
        if hasattr(row, "synced_at") and row.synced_at is not None
    ]
    return max(timestamps) if timestamps else None


def aggregate_structured_monthly_rows(
    rows: list,
    *,
    start_date: date,
    end_date: date,
) -> list[SaudeMonthlySeriesItem]:
    aggregated: dict[tuple[int, int], int] = defaultdict(int)
    labels: dict[tuple[int, int], str] = {}
    start_key = (start_date.year, start_date.month)
    end_key = (end_date.year, end_date.month)

    for row in rows:
        row_month = getattr(row, "mes", None)
        row_year = getattr(row, "ano", None)
        if row_month is None or row_year is None:
            continue
        key = (int(row_year), int(row_month))
        if key < start_key or key > end_key:
            continue
        aggregated[key] += int(getattr(row, "quantidade", 0))
        labels[key] = month_label(key[0], key[1], getattr(row, "label", None))

    return [
        SaudeMonthlySeriesItem(label=labels[key], value=aggregated[key])
        for key in sorted(aggregated)
    ]


def aggregate_label_value_rows(rows: list) -> list[SaudeLabelValueItem]:
    aggregated: dict[str, int] = defaultdict(int)
    for row in rows:
        label = str(getattr(row, "label", "")).strip()
        if not label:
            continue
        aggregated[label] += int(getattr(row, "quantidade", getattr(row, "valor", 0)))
    return [
        SaudeLabelValueItem(label=label, value=value)
        for label, value in sorted(aggregated.items(), key=lambda item: (-item[1], item[0]))
    ]


def collect_vacinacao_rows(
    repo: SQLSaudeRepository,
    *,
    years: list[int],
    dataset: str,
) -> list:
    rows: list = []
    for target_year in years:
        rows.extend(repo.list_vacinacao_rows(ano=target_year, dataset=dataset))
    return rows


def collect_atencao_primaria_rows(
    repo: SQLSaudeRepository,
    *,
    years: list[int],
    dataset: str,
) -> list:
    rows: list = []
    for target_year in years:
        rows.extend(repo.list_atencao_primaria_rows(ano=target_year, dataset=dataset))
    return rows


def collect_farmacia_rows(
    repo: SQLSaudeRepository,
    *,
    years: list[int],
    dataset: str,
) -> list:
    rows: list = []
    for target_year in years:
        rows.extend(repo.list_farmacia_rows(ano=target_year, dataset=dataset))
    return rows


def collect_bucal_rows(
    repo: SQLSaudeRepository,
    *,
    years: list[int],
) -> list:
    rows: list = []
    for target_year in years:
        rows.extend(repo.list_bucal_rows(ano=target_year))
    return rows


def build_structured_medicamentos_estoque_response(
    repo: SQLSaudeRepository,
    *,
    search: str | None,
    estabelecimento: str | None,
    page: int,
    page_size: int,
) -> SaudeMedicationStockResponse | None:
    medicamentos = repo.list_medicamentos(search=search, estabelecimento=estabelecimento)
    if not medicamentos:
        return None
    synced = repo.get_medicamentos_synced_at()
    items = [
        SaudeMedicationItem(
            product_name=item.product_name,
            unit=item.unit,
            in_stock=item.in_stock,
            minimum_stock=item.minimum_stock,
            department=item.department,
            establishment=item.establishment,
            below_minimum=below_minimum(item.in_stock, item.minimum_stock),
        )
        for item in medicamentos
    ]
    start = (page - 1) * page_size
    end = start + page_size
    return SaudeMedicationStockResponse(
        items=items[start:end],
        total=len(items),
        page=page,
        page_size=page_size,
        total_abaixo_minimo=sum(1 for item in items if item.below_minimum),
        last_synced_at=synced,
    )


def build_structured_medicamentos_dispensados_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
) -> SaudeMedicamentosDispensadosResponse | None:
    ranking_rows = repo.list_farmacia_rows(ano=year, dataset="ranking")
    dispensados_rows = repo.list_farmacia_rows(ano=year, dataset="dispensados_mensal")
    atendimentos_rows = repo.list_farmacia_rows(ano=year, dataset="atendimentos_mensal")
    if not ranking_rows and not dispensados_rows and not atendimentos_rows:
        return None
    synced = max_synced_from_rows(ranking_rows, dispensados_rows, atendimentos_rows)
    return SaudeMedicamentosDispensadosResponse(
        ranking=rows_to_label_value(ranking_rows),
        series_mensal_dispensacao=rows_to_monthly_series(dispensados_rows),
        series_mensal_atendimentos=rows_to_monthly_series(atendimentos_rows),
        last_synced_at=synced,
    )


def build_structured_vacinacao_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeVacinacaoResponse | None:
    effective_start, effective_end = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)
    mensal_rows = collect_vacinacao_rows(repo, years=years, dataset="mensal")
    ranking_rows = collect_vacinacao_rows(repo, years=years, dataset="ranking")
    if not mensal_rows and not ranking_rows:
        return None
    mensal = aggregate_structured_monthly_rows(
        mensal_rows,
        start_date=effective_start,
        end_date=effective_end,
    )
    return SaudeVacinacaoResponse(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        aplicadas_por_mes=mensal,
        ranking_vacinas=aggregate_label_value_rows(ranking_rows),
        total_aplicadas=sum_values(mensal),
        last_synced_at=max_synced_from_rows(mensal_rows, ranking_rows),
    )


def build_structured_atencao_primaria_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
    effective_start_date: date,
    effective_end_date: date,
) -> SaudeAtencaoPrimariaResponse | None:
    years = list(range(effective_start_date.year, effective_end_date.year + 1))
    mensal_rows = collect_atencao_primaria_rows(repo, years=years, dataset="atendimentos_mensal")
    procedimentos_rows = collect_atencao_primaria_rows(repo, years=years, dataset="procedimentos")
    cbo_rows = collect_atencao_primaria_rows(repo, years=years, dataset="cbo")
    if not mensal_rows and not procedimentos_rows and not cbo_rows:
        return None
    mensal = aggregate_structured_monthly_rows(
        mensal_rows,
        start_date=effective_start_date,
        end_date=effective_end_date,
    )
    categorias = aggregate_label_value_rows(cbo_rows)
    return SaudeAtencaoPrimariaResponse(
        year=year,
        start_date=effective_start_date.isoformat(),
        end_date=effective_end_date.isoformat(),
        atendimentos_por_mes=mensal,
        procedimentos_por_especialidade=aggregate_label_value_rows(procedimentos_rows),
        atendimentos_por_categoria=categorias,
        atendimentos_por_cbo=categorias,
        last_synced_at=max_synced_from_rows(mensal_rows, procedimentos_rows, cbo_rows),
    )


def build_structured_saude_bucal_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeBucalResponse | None:
    effective_start, effective_end = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)
    bucal_rows = collect_bucal_rows(repo, years=years)
    if not bucal_rows:
        return None
    mensal = aggregate_structured_monthly_rows(
        bucal_rows,
        start_date=effective_start,
        end_date=effective_end,
    )
    return SaudeBucalResponse(
        year=year,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        atendimentos_por_mes=mensal,
        total_atendimentos=sum_values(mensal),
        last_synced_at=max_synced_from_rows(bucal_rows),
    )


def build_structured_farmacia_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeFarmaciaResponse | None:
    effective_start, effective_end = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)
    ranking_rows = collect_farmacia_rows(repo, years=years, dataset="ranking")
    dispensados_rows = collect_farmacia_rows(repo, years=years, dataset="dispensados_mensal")
    atendimentos_rows = collect_farmacia_rows(repo, years=years, dataset="atendimentos_mensal")
    if not ranking_rows and not dispensados_rows and not atendimentos_rows:
        return None
    atendimentos_por_mes = aggregate_structured_monthly_rows(
        atendimentos_rows,
        start_date=effective_start,
        end_date=effective_end,
    )
    medicamentos_dispensados_por_mes = aggregate_structured_monthly_rows(
        dispensados_rows,
        start_date=effective_start,
        end_date=effective_end,
    )
    return SaudeFarmaciaResponse(
        year=year,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        atendimentos_por_mes=atendimentos_por_mes,
        medicamentos_dispensados_por_mes=medicamentos_dispensados_por_mes,
        top_medicamentos=aggregate_label_value_rows(ranking_rows),
        total_atendimentos=sum_values(atendimentos_por_mes),
        total_dispensados=sum_values(medicamentos_dispensados_por_mes),
        last_synced_at=max_synced_from_rows(ranking_rows, dispensados_rows, atendimentos_rows),
    )


def build_structured_procedimentos_tipo_response(
    repo: SQLSaudeRepository,
) -> SaudeProcedimentosTipoResponse | None:
    proc_rows = repo.list_procedimentos_rows()
    if not proc_rows:
        return None
    return SaudeProcedimentosTipoResponse(
        items=rows_to_label_value(proc_rows),
        last_synced_at=max_synced_from_rows(proc_rows),
    )
