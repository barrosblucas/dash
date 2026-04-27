"""Composição dos dashboards públicos da feature saude."""

from __future__ import annotations

from datetime import date, datetime

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_builders import build_farmacia_response
from backend.features.saude.saude_public_live import (
    load_atencao_primaria_cbo,
    load_atencao_primaria_procedimentos,
    load_chart_payload,
    load_farmacia_ranking,
    load_hospital_payload,
    load_vacinacao_ranking,
)
from backend.features.saude.saude_public_structured import (
    aggregate_label_value_rows,
    aggregate_structured_monthly_rows,
    collect_atencao_primaria_rows,
    collect_farmacia_rows,
    collect_vacinacao_rows,
    collect_years_for_period,
    max_synced_from_rows,
    resolve_period_bounds,
)
from backend.features.saude.saude_snapshot_mapper import (
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    filter_monthly_series_by_date_range,
    hospital_censo_from_payload,
    hospital_table_to_items,
    max_synced_at,
    sum_values,
)
from backend.features.saude.saude_types import (
    SaudeAtencaoPrimariaResponse,
    SaudeFarmaciaResponse,
    SaudeHospitalResponse,
    SaudeSnapshotResource,
    SaudeVacinacaoResponse,
)

UNAVAILABLE_HOSPITAL_RESOURCES = [
    "mapa_de_calor",
    "internacoes_por_mes",
    "internacoes_por_cid",
    "media_permanencia",
    "nao_municipes",
    "especialidades_medicas",
    "outras_especialidades",
]


async def build_vacinacao_dashboard(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeVacinacaoResponse:
    effective_start_date, effective_end_date = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)

    mensal_rows = collect_vacinacao_rows(repo, years=years, dataset="mensal")
    if mensal_rows:
        mensal = aggregate_structured_monthly_rows(
            mensal_rows,
            start_date=effective_start_date,
            end_date=effective_end_date,
        )
        mensal_synced = max_synced_from_rows(mensal_rows)
    else:
        monthly_items = []
        monthly_synced_values: list[datetime | None] = []
        for target_year in years:
            payload, synced_at = await load_chart_payload(
                repo,
                SaudeSnapshotResource.VACINAS_POR_MES,
                year=target_year,
            )
            monthly_items.extend(chart_to_monthly_series_items(payload))
            monthly_synced_values.append(synced_at)
        mensal = filter_monthly_series_by_date_range(
            monthly_items,
            datetime(effective_start_date.year, effective_start_date.month, effective_start_date.day),
            datetime(effective_end_date.year, effective_end_date.month, effective_end_date.day),
        )
        mensal_synced = max_synced_at(*monthly_synced_values)

    ranking_rows = collect_vacinacao_rows(repo, years=years, dataset="ranking")
    if ranking_rows:
        ranking = aggregate_label_value_rows(ranking_rows)
        ranking_synced = max_synced_from_rows(ranking_rows)
    elif start_date is not None and end_date is not None:
        ranking_payload, ranking_synced = await load_vacinacao_ranking(repo, start_date, end_date)
        ranking = chart_to_label_value_items(ranking_payload)
    else:
        ranking_payload, ranking_synced = repo.get_snapshot_payload(SaudeSnapshotResource.VACINAS_RANKING)
        ranking = chart_to_label_value_items(ranking_payload)

    return SaudeVacinacaoResponse(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        aplicadas_por_mes=mensal,
        ranking_vacinas=ranking,
        total_aplicadas=sum_values(mensal),
        last_synced_at=max_synced_at(mensal_synced, ranking_synced),
    )


async def build_atencao_primaria_dashboard(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeAtencaoPrimariaResponse:
    effective_start_date, effective_end_date = resolve_period_bounds(year, start_date, end_date)
    years = list(range(effective_start_date.year, effective_end_date.year + 1))
    use_range_slices = start_date is not None or end_date is not None

    mensal_rows = collect_atencao_primaria_rows(repo, years=years, dataset="atendimentos_mensal")
    if mensal_rows:
        atendimentos_mensal = aggregate_structured_monthly_rows(
            mensal_rows,
            start_date=effective_start_date,
            end_date=effective_end_date,
        )
        mensal_synced = max_synced_from_rows(mensal_rows)
    else:
        monthly_items = []
        monthly_synced_values: list[datetime | None] = []
        for target_year in years:
            mensal_payload, synced_at = await load_chart_payload(
                repo,
                SaudeSnapshotResource.ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL,
                year=target_year,
            )
            monthly_items.extend(chart_to_monthly_series_items(mensal_payload))
            monthly_synced_values.append(synced_at)
        atendimentos_mensal = filter_monthly_series_by_date_range(
            monthly_items,
            datetime(effective_start_date.year, effective_start_date.month, effective_start_date.day),
            datetime(effective_end_date.year, effective_end_date.month, effective_end_date.day),
        )
        mensal_synced = max_synced_at(*monthly_synced_values)

    procedimentos_rows = collect_atencao_primaria_rows(repo, years=years, dataset="procedimentos")
    if procedimentos_rows and not use_range_slices:
        procedimentos = aggregate_label_value_rows(procedimentos_rows)
        procedimentos_synced = max_synced_from_rows(procedimentos_rows)
    else:
        procedimentos_payload, procedimentos_synced = await load_atencao_primaria_procedimentos(
            repo,
            effective_start_date,
            effective_end_date,
        )
        procedimentos = chart_to_label_value_items(procedimentos_payload)

    cbo_rows = collect_atencao_primaria_rows(repo, years=years, dataset="cbo")
    if cbo_rows and not use_range_slices:
        categorias = aggregate_label_value_rows(cbo_rows)
        cbo_synced = max_synced_from_rows(cbo_rows)
    else:
        cbo_payload, cbo_synced = await load_atencao_primaria_cbo(
            repo,
            year=year,
            start_date=effective_start_date,
            end_date=effective_end_date,
        )
        categorias = chart_to_label_value_items(cbo_payload)

    return SaudeAtencaoPrimariaResponse(
        year=year,
        start_date=effective_start_date.isoformat(),
        end_date=effective_end_date.isoformat(),
        atendimentos_por_mes=atendimentos_mensal,
        procedimentos_por_especialidade=procedimentos,
        atendimentos_por_categoria=categorias,
        atendimentos_por_cbo=categorias,
        last_synced_at=max_synced_at(mensal_synced, procedimentos_synced, cbo_synced),
    )


async def build_hospital_dashboard(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
    estabelecimento_id: int | None,
) -> SaudeHospitalResponse:
    effective_start_date, effective_end_date = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)

    censo_payload, censo_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_CENSO,
        estabelecimento_id=estabelecimento_id,
    )
    procedimentos_payload, procedimentos_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS,
        estabelecimento_id=estabelecimento_id,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )
    cid_payload, cid_synced = await load_hospital_payload(
        repo,
        SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_CID,
        estabelecimento_id=estabelecimento_id,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )

    monthly_items = []
    monthly_synced_values: list[datetime | None] = []
    for target_year in years:
        mensal_payload, synced_at = await load_hospital_payload(
            repo,
            SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL,
            estabelecimento_id=estabelecimento_id,
            year=target_year,
        )
        monthly_items.extend(chart_to_monthly_series_items(mensal_payload))
        monthly_synced_values.append(synced_at)

    atendimentos_por_mes = filter_monthly_series_by_date_range(
        monthly_items,
        datetime(effective_start_date.year, effective_start_date.month, effective_start_date.day),
        datetime(effective_end_date.year, effective_end_date.month, effective_end_date.day),
    )
    mensal_synced = max_synced_at(*monthly_synced_values)

    procedimentos_realizados, total_procedimentos = hospital_table_to_items(procedimentos_payload)
    atendimentos_por_cid = chart_to_label_value_items(cid_payload)
    unavailable_resources = list(UNAVAILABLE_HOSPITAL_RESOURCES)
    if not procedimentos_realizados:
        unavailable_resources.append("procedimentos_realizados")
    if not atendimentos_por_cid:
        unavailable_resources.append("atendimentos_por_cid")

    return SaudeHospitalResponse(
        estabelecimento_id=estabelecimento_id,
        censo=hospital_censo_from_payload(censo_payload),
        procedimentos_realizados=procedimentos_realizados,
        total_procedimentos=total_procedimentos,
        atendimentos_por_mes=atendimentos_por_mes,
        internacoes_por_mes=[],
        internacoes_por_cid=atendimentos_por_cid,
        media_permanencia=[],
        recursos_indisponiveis=unavailable_resources,
        last_synced_at=max_synced_at(censo_synced, procedimentos_synced, mensal_synced, cid_synced),
    )


async def build_farmacia_dashboard(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeFarmaciaResponse:
    effective_start_date, effective_end_date = resolve_period_bounds(year, start_date, end_date)
    years = collect_years_for_period(year, start_date, end_date)

    atendimentos_rows = collect_farmacia_rows(repo, years=years, dataset="atendimentos_mensal")
    if not atendimentos_rows:
        return await build_farmacia_response(
            repo,
            year=year,
            start_date=start_date,
            end_date=end_date,
        )

    atendimentos_por_mes = aggregate_structured_monthly_rows(
        atendimentos_rows,
        start_date=effective_start_date,
        end_date=effective_end_date,
    )
    if start_date is not None and end_date is not None and not atendimentos_por_mes:
        return await build_farmacia_response(
            repo,
            year=year,
            start_date=start_date,
            end_date=end_date,
        )
    atendimentos_synced = max_synced_from_rows(atendimentos_rows)

    dispensados_rows = collect_farmacia_rows(repo, years=years, dataset="dispensados_mensal")
    if dispensados_rows:
        medicamentos_dispensados_por_mes = aggregate_structured_monthly_rows(
            dispensados_rows,
            start_date=effective_start_date,
            end_date=effective_end_date,
        )
        dispensados_synced = max_synced_from_rows(dispensados_rows)
    elif start_date is not None and end_date is not None:
        dispensados_payload, dispensados_synced = await load_chart_payload(
            repo,
            SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL,
            start_date=start_date,
            end_date=end_date,
        )
        medicamentos_dispensados_por_mes = filter_monthly_series_by_date_range(
            chart_to_monthly_series_items(dispensados_payload),
            datetime(effective_start_date.year, effective_start_date.month, effective_start_date.day),
            datetime(effective_end_date.year, effective_end_date.month, effective_end_date.day),
        )
    else:
        medicamentos_dispensados_por_mes = []
        dispensados_synced = None

    ranking_rows = collect_farmacia_rows(repo, years=years, dataset="ranking")
    if ranking_rows:
        top_medicamentos = aggregate_label_value_rows(ranking_rows)
        ranking_synced = max_synced_from_rows(ranking_rows)
    elif start_date is not None and end_date is not None:
        ranking_payload, ranking_synced = await load_farmacia_ranking(repo, start_date, end_date)
        top_medicamentos = chart_to_label_value_items(ranking_payload)
    else:
        ranking_payload, ranking_synced = repo.get_snapshot_payload(SaudeSnapshotResource.MEDICAMENTOS_RANKING)
        top_medicamentos = chart_to_label_value_items(ranking_payload)

    return SaudeFarmaciaResponse(
        year=year,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        atendimentos_por_mes=atendimentos_por_mes,
        medicamentos_dispensados_por_mes=medicamentos_dispensados_por_mes,
        top_medicamentos=top_medicamentos,
        total_atendimentos=sum_values(atendimentos_por_mes),
        total_dispensados=sum_values(medicamentos_dispensados_por_mes),
        last_synced_at=max_synced_at(atendimentos_synced, dispensados_synced, ranking_synced),
    )
