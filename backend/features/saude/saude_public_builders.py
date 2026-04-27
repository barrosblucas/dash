"""Builders live e fallbacks públicos da feature saude."""

from __future__ import annotations

from datetime import date, datetime

from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_public_live import (
    load_chart_payload,
    load_farmacia_ranking,
    load_visitas_payload,
)
from backend.features.saude.saude_public_support import (
    below_minimum,
    coerce_int,
    coerce_optional_int,
    matches_medicamento,
    nullable_string,
)
from backend.features.saude.saude_snapshot_mapper import (
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    filter_monthly_series_by_date_range,
    max_synced_at,
    sum_values,
)
from backend.features.saude.saude_types import (
    SaudeFarmaciaResponse,
    SaudeMedicationItem,
    SaudeMedicationStockResponse,
    SaudeMonthlySeriesItem,
    SaudeSnapshotResource,
    SaudeVisitasDomiciliaresResponse,
)


def _filter_by_dates(
    series: list[SaudeMonthlySeriesItem],
    start_date: date | None,
    end_date: date | None,
) -> list[SaudeMonthlySeriesItem]:
    if start_date is None or end_date is None:
        return series
    return filter_monthly_series_by_date_range(
        series,
        datetime(start_date.year, start_date.month, start_date.day),
        datetime(end_date.year, end_date.month, end_date.day),
    )


async def build_farmacia_response(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date | None,
    end_date: date | None,
) -> SaudeFarmaciaResponse:
    effective_start = start_date or date(year, 1, 1)
    effective_end = end_date or date(year, 12, 31)

    if start_date is not None and end_date is not None:
        atendimentos_payload, atendimentos_synced = await load_chart_payload(
            repo,
            SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            start_date=start_date,
            end_date=end_date,
        )
        dispensados_payload, dispensados_synced = await load_chart_payload(
            repo,
            SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL,
            start_date=start_date,
            end_date=end_date,
        )
        ranking_payload, ranking_synced = await load_farmacia_ranking(
            repo,
            start_date,
            end_date,
        )
    else:
        atendimentos_payload, atendimentos_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
            year,
        )
        dispensados_payload, dispensados_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL
        )
        ranking_payload, ranking_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.MEDICAMENTOS_RANKING
        )

    series_year = None if (start_date is not None and end_date is not None) else year
    atendimentos_por_mes = chart_to_monthly_series_items(atendimentos_payload, year=series_year)
    medicamentos_dispensados_por_mes = chart_to_monthly_series_items(
        dispensados_payload,
        year=series_year,
    )

    atendimentos_por_mes = _filter_by_dates(atendimentos_por_mes, effective_start, effective_end)
    medicamentos_dispensados_por_mes = _filter_by_dates(medicamentos_dispensados_por_mes, effective_start, effective_end)

    return SaudeFarmaciaResponse(
        year=year,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        atendimentos_por_mes=atendimentos_por_mes,
        medicamentos_dispensados_por_mes=medicamentos_dispensados_por_mes,
        top_medicamentos=chart_to_label_value_items(ranking_payload),
        total_atendimentos=sum_values(atendimentos_por_mes),
        total_dispensados=sum_values(medicamentos_dispensados_por_mes),
        last_synced_at=max_synced_at(
            dispensados_synced, atendimentos_synced, ranking_synced
        ),
    )


async def build_visitas_domiciliares_response(
    repo: SQLSaudeRepository,
    *,
    start_date: date | None,
    end_date: date | None,
) -> SaudeVisitasDomiciliaresResponse:
    if start_date is not None and end_date is not None:
        motivos, motivos_synced = await load_visitas_payload(
            repo, SaudeSnapshotResource.VISITAS_MOTIVOS, start_date, end_date
        )
        acompanhamento, acompanhamento_synced = await load_visitas_payload(
            repo, SaudeSnapshotResource.VISITAS_ACOMPANHAMENTO, start_date, end_date
        )
        busca_ativa, busca_ativa_synced = await load_visitas_payload(
            repo, SaudeSnapshotResource.VISITAS_BUSCA_ATIVA, start_date, end_date
        )
        controle, controle_synced = await load_visitas_payload(
            repo, SaudeSnapshotResource.VISITAS_CONTROLE_VETORIAL, start_date, end_date
        )
    else:
        motivos, motivos_synced = repo.get_snapshot_payload(SaudeSnapshotResource.VISITAS_MOTIVOS)
        acompanhamento, acompanhamento_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.VISITAS_ACOMPANHAMENTO
        )
        busca_ativa, busca_ativa_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.VISITAS_BUSCA_ATIVA
        )
        controle, controle_synced = repo.get_snapshot_payload(
            SaudeSnapshotResource.VISITAS_CONTROLE_VETORIAL
        )
    return SaudeVisitasDomiciliaresResponse(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        motivos_visita=chart_to_label_value_items(motivos),
        acompanhamento=chart_to_label_value_items(acompanhamento),
        busca_ativa=chart_to_label_value_items(busca_ativa),
        controle_vetorial=chart_to_label_value_items(controle),
        last_synced_at=max_synced_at(
            motivos_synced,
            acompanhamento_synced,
            busca_ativa_synced,
            controle_synced,
        ),
    )


def build_medicamentos_estoque_response(
    repo: SQLSaudeRepository,
    *,
    search: str | None,
    estabelecimento: str | None,
    page: int,
    page_size: int,
) -> SaudeMedicationStockResponse:
    payload, last_synced_at = repo.get_snapshot_payload(
        SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE
    )
    medicamentos = payload.get("medicamentos", []) if isinstance(payload, dict) else []
    filtered = []
    for item in medicamentos:
        if not isinstance(item, dict) or not matches_medicamento(
            item, search=search, estabelecimento=estabelecimento
        ):
            continue
        minimum_stock = item.get("estoque_minimo")
        filtered.append(
            SaudeMedicationItem(
                product_name=str(item.get("nome_do_produto") or ""),
                unit=nullable_string(item.get("unidade_do_produto")),
                in_stock=coerce_int(item.get("em_estoque")),
                minimum_stock=coerce_optional_int(minimum_stock),
                department=nullable_string(item.get("departamento")),
                establishment=nullable_string(item.get("estabelecimento")),
                below_minimum=below_minimum(item.get("em_estoque"), minimum_stock),
            )
        )
    start = (page - 1) * page_size
    end = start + page_size
    return SaudeMedicationStockResponse(
        items=filtered[start:end],
        total=len(filtered),
        page=page,
        page_size=page_size,
        total_abaixo_minimo=sum(1 for item in filtered if item.below_minimum),
        last_synced_at=last_synced_at,
    )
