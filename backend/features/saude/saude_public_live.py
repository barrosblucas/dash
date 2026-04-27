"""Leituras live e utilitários de histórico da feature saude."""

from __future__ import annotations

import json
from datetime import UTC, date, datetime, timedelta
from typing import Any

from backend.features.saude.saude_adapter import ESaudeClient, SaudeExternalAPIError
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_hospital_payloads import (
    hospital_payload_params,
    hospital_resource_path,
    hospital_source_url,
)
from backend.features.saude.saude_public_support import external_error
from backend.features.saude.saude_resource_catalog import RESOURCE_DEFINITIONS
from backend.features.saude.saude_sync import (
    is_default_scope_for_year,
    is_year_scoped,
    resource_source_url,
)
from backend.features.saude.saude_types import SaudeSnapshotResource


async def load_chart_payload(
    repo: SQLSaudeRepository,
    resource: SaudeSnapshotResource,
    *,
    year: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[Any | None, datetime | None]:
    """Busca snapshot ou live conforme escopo e parâmetros fornecidos."""
    if start_date is not None and end_date is not None:
        source_url = build_range_source_url(resource, start_date, end_date)
        snapshot, synced = repo.get_snapshot_payload_by_source_url(resource, source_url)
        if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
            return snapshot, synced
        endpoint, _, _ = RESOURCE_DEFINITIONS[resource]
        client = ESaudeClient()
        try:
            payload = await client.fetch_chart_by_date_range(
                endpoint.replace("buscar-dados-do-chart/", ""),
                start_date,
                end_date,
            )
        except SaudeExternalAPIError as exc:
            raise external_error(exc) from exc
        synced_at = _utc_now_naive()
        repo.replace_snapshot(
            resource=resource,
            payload=payload,
            synced_at=synced_at,
            source_url=source_url,
        )
        return payload, synced_at

    if year is not None and is_year_scoped(resource):
        snapshot, synced = repo.get_snapshot_payload(resource, year)
        if snapshot is not None:
            return snapshot, synced
        endpoint, _, _ = RESOURCE_DEFINITIONS[resource]
        client = ESaudeClient()
        try:
            payload = await client.fetch_chart_by_year(
                endpoint.replace("buscar-dados-do-chart/", ""),
                year,
            )
        except SaudeExternalAPIError as exc:
            raise external_error(exc) from exc
        synced_at = _utc_now_naive()
        repo.replace_snapshot(
            resource=resource,
            payload=payload,
            synced_at=synced_at,
            scope_year=year,
            source_url=resource_source_url(resource, year),
        )
        return payload, synced_at

    return repo.get_snapshot_payload(resource)


async def load_atencao_primaria_cbo(
    repo: SQLSaudeRepository,
    *,
    year: int,
    start_date: date,
    end_date: date,
) -> tuple[Any | None, datetime | None]:
    if is_default_scope_for_year(start_date, year):
        return repo.get_snapshot_payload(SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO, year)
    source_url = build_range_source_url(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO,
        start_date,
        end_date,
    )
    snapshot, synced = repo.get_snapshot_payload_by_source_url(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO,
        source_url,
    )
    if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
        return snapshot, synced
    client = ESaudeClient()
    try:
        payload = await client.fetch_public_payload(
            "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-atencao-basica",
            params={
                "data_de_inicio": start_date.isoformat(),
                "data_de_fim": end_date.isoformat(),
            },
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO,
        payload=payload,
        synced_at=synced_at,
        source_url=source_url,
    )
    return payload, synced_at


async def load_atencao_primaria_procedimentos(
    repo: SQLSaudeRepository,
    start_date: date,
    end_date: date,
) -> tuple[Any | None, datetime | None]:
    source_url = build_range_source_url(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS,
        start_date,
        end_date,
    )
    snapshot, synced = repo.get_snapshot_payload_by_source_url(
        SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS,
        source_url,
    )
    if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
        return snapshot, synced
    client = ESaudeClient()
    try:
        payload = await client.fetch_chart_by_date_range(
            "atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade",
            start_date,
            end_date,
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS,
        payload=payload,
        synced_at=synced_at,
        source_url=source_url,
    )
    return payload, synced_at


async def load_visitas_payload(
    repo: SQLSaudeRepository,
    resource: SaudeSnapshotResource,
    start_date: date,
    end_date: date,
) -> tuple[Any | None, datetime | None]:
    source_url = build_range_source_url(resource, start_date, end_date)
    snapshot, synced = repo.get_snapshot_payload_by_source_url(resource, source_url)
    if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
        return snapshot, synced
    endpoint, _, _ = RESOURCE_DEFINITIONS[resource]
    client = ESaudeClient()
    try:
        payload = await client.fetch_chart_by_date_range(
            endpoint.replace("buscar-dados-do-chart/", ""),
            start_date,
            end_date,
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=resource,
        payload=payload,
        synced_at=synced_at,
        source_url=source_url,
    )
    return payload, synced_at


async def load_farmacia_ranking(
    repo: SQLSaudeRepository,
    start_date: date,
    end_date: date,
) -> tuple[Any | None, datetime | None]:
    source_url = f"/publico/saude-transparente/buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas?data_de_inicio={start_date.isoformat()}&data_de_fim={end_date.isoformat()}"
    snapshot, synced = repo.get_snapshot_payload_by_source_url(
        SaudeSnapshotResource.MEDICAMENTOS_RANKING,
        source_url,
    )
    if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
        return snapshot, synced
    client = ESaudeClient()
    try:
        payload = await client.fetch_chart_by_date_range(
            "lista-de-medicamentos-com-mais-saidas",
            start_date,
            end_date,
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=SaudeSnapshotResource.MEDICAMENTOS_RANKING,
        payload=payload,
        synced_at=synced_at,
        source_url=source_url,
    )
    return payload, synced_at


async def load_vacinacao_ranking(
    repo: SQLSaudeRepository,
    start_date: date,
    end_date: date,
) -> tuple[Any | None, datetime | None]:
    source_url = f"/publico/saude-transparente/buscar-dados-do-chart/vacinas-mais-aplicadas-por-periodo?data_de_inicio={start_date.isoformat()}&data_de_fim={end_date.isoformat()}"
    snapshot, synced = repo.get_snapshot_payload_by_source_url(
        SaudeSnapshotResource.VACINAS_RANKING,
        source_url,
    )
    if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
        return snapshot, synced
    client = ESaudeClient()
    try:
        payload = await client.fetch_chart_by_date_range(
            "vacinas-mais-aplicadas-por-periodo",
            start_date,
            end_date,
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=SaudeSnapshotResource.VACINAS_RANKING,
        payload=payload,
        synced_at=synced_at,
        source_url=source_url,
    )
    return payload, synced_at


async def load_hospital_payload(
    repo: SQLSaudeRepository,
    resource: SaudeSnapshotResource,
    *,
    estabelecimento_id: int | None,
    year: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[Any | None, datetime | None]:
    if (
        estabelecimento_id is None
        and year is not None
        and is_year_scoped(resource)
        and start_date is None
        and end_date is None
    ):
        snapshot, synced = repo.get_snapshot_payload(resource, year)
        if snapshot is not None:
            return snapshot, synced

    if estabelecimento_id is None and year is None and start_date is None and end_date is None:
        return repo.get_snapshot_payload(resource)

    params = hospital_payload_params(
        resource,
        estabelecimento_id=estabelecimento_id,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )
    source_url = hospital_source_url(resource, params)
    snapshot, synced = repo.get_snapshot_payload_by_source_url(resource, source_url)
    if start_date is not None and end_date is not None:
        if snapshot is not None and not _should_refresh_range_snapshot(start_date, end_date, synced):
            return snapshot, synced
    elif snapshot is not None:
        return snapshot, synced

    client = ESaudeClient()
    try:
        payload = await client.fetch_public_payload(
            hospital_resource_path(resource),
            params=params,
        )
    except SaudeExternalAPIError as exc:
        raise external_error(exc) from exc
    synced_at = _utc_now_naive()
    repo.replace_snapshot(
        resource=resource,
        payload=payload,
        synced_at=synced_at,
        scope_year=year if year is not None and is_year_scoped(resource) and estabelecimento_id is None else None,
        source_url=source_url,
    )
    return payload, synced_at


def history_payload(history: list[Any], index: int) -> Any | None:
    if len(history) <= index:
        return None
    payload_json = history[index].payload_json
    if not isinstance(payload_json, str):
        return None
    return json.loads(payload_json)


def build_range_source_url(
    resource: SaudeSnapshotResource,
    start_date: date,
    end_date: date,
) -> str:
    endpoint, _, _ = RESOURCE_DEFINITIONS[resource]
    return (
        f"/publico/saude-transparente/{endpoint}"
        f"?data_de_inicio={start_date.isoformat()}&data_de_fim={end_date.isoformat()}"
    )


def _should_refresh_range_snapshot(
    start_date: date,
    end_date: date,
    synced_at: datetime | None,
) -> bool:
    if synced_at is None:
        return True
    now = datetime.now(UTC).replace(tzinfo=None)
    current_month_start = date(now.year, now.month, 1)
    if end_date < current_month_start:
        return False
    return now - synced_at >= timedelta(minutes=10)


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)
