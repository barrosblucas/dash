"""Orquestração de sync da feature saude."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

from backend.features.saude.saude_adapter import ESaudeClient, SaudeExternalAPIError
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_resource_catalog import (
    DEFAULT_SYNC_RESOURCES,
    RESOURCE_DEFINITIONS,
)
from backend.features.saude.saude_types import (
    SaudeSnapshotResource,
    SaudeSyncRequest,
    SaudeSyncResponse,
    SaudeSyncTriggerType,
    SaudeUnitScheduleItem,
)
from backend.features.saude.saude_unit_import import (
    build_unit_create_request,
    parse_imported_schedules,
    unit_payload_to_update,
)


class SaudeSyncService:
    """Orquestra sincronização dos recursos públicos do E-Saúde."""

    def __init__(self, client: ESaudeClient | None = None):
        self._client = client or ESaudeClient()

    async def sync(
        self,
        repo: SQLSaudeRepository,
        request: SaudeSyncRequest,
        *,
        trigger_type: SaudeSyncTriggerType,
    ) -> SaudeSyncResponse:
        years = _resolve_years(request.years)
        resources = request.resources or DEFAULT_SYNC_RESOURCES
        started_at = _utc_now_naive()

        # Coleta todos os payloads antes de abrir transacao de persistencia
        # para evitar manter lock do SQLite durante I/O de rede.
        payloads_to_persist: list[
            tuple[SaudeSnapshotResource, int | None, Any, str]
        ] = []
        errors: list[str] = []
        for resource in resources:
            if is_year_scoped(resource):
                scope_years: list[int | None] = [int(item) for item in years]
            else:
                scope_years = [None]
            for scope_year in scope_years:
                try:
                    payload = await self.fetch_resource_payload(resource, scope_year)
                    payloads_to_persist.append(
                        (
                            resource,
                            scope_year,
                            payload,
                            resource_source_url(resource, scope_year),
                        )
                    )
                except SaudeExternalAPIError as exc:
                    errors.append(sync_error_label(resource, scope_year, exc))

        finished_at = _utc_now_naive()
        status = (
            "success" if not errors else ("partial" if payloads_to_persist else "error")
        )

        # Persistencia em transacao unica e curta (sem await no meio)
        synced_resources = 0
        log = repo.create_sync_log(
            trigger_type=trigger_type,
            status="running",
            started_at=started_at,
            resources=resources,
            years=years,
        )
        for resource, scope_year, payload, source_url in payloads_to_persist:
            repo.replace_snapshot(
                resource=resource,
                payload=payload,
                synced_at=finished_at,
                scope_year=scope_year,
                source_url=source_url,
            )
            synced_resources += 1
        repo.update_sync_log(
            log,
            status=status,
            finished_at=finished_at,
            error_message="; ".join(errors) if errors else None,
        )
        return SaudeSyncResponse(
            status=status,
            years=years,
            resources=resources,
            synced_resources=synced_resources,
            failed_resources=len(errors),
            errors=errors,
            started_at=started_at,
            finished_at=finished_at,
        )

    async def import_units(self, repo: SQLSaudeRepository) -> tuple[int, int, int]:
        imported = 0
        updated = 0
        payload = await self._client.fetch_localizacao_unidades()
        for item in payload:
            external_id = _to_int(item.get("id"))
            if external_id is None:
                continue
            existing = repo.get_unit_by_external_id(external_id)
            unit_payload = build_unit_create_request(item)
            if existing is None:
                repo.create_unit(unit_payload)
                imported += 1
            else:
                repo.update_unit(existing, unit_payload_to_update(unit_payload))
                updated += 1
            schedules = await self._build_imported_schedules(external_id)
            target = repo.get_unit_by_external_id(external_id)
            if target is not None:
                repo.replace_unit_schedules(int(target.id), schedules)
        return imported, updated, len(payload)

    async def fetch_resource_payload(
        self,
        resource: SaudeSnapshotResource,
        year: int | None = None,
    ) -> Any:
        if resource is SaudeSnapshotResource.QUANTITATIVOS:
            return await self._client.fetch_quantitativos()
        if resource is SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE:
            return await self._client.fetch_medicamentos_tabela()
        endpoint, _, _ = RESOURCE_DEFINITIONS[resource]
        return await self._client.fetch_public_payload(
            endpoint,
            params=resource_params(resource, year) or None,
        )

    async def _build_imported_schedules(
        self,
        external_id: int,
    ) -> list[SaudeUnitScheduleItem]:
        payload = await self._client.fetch_unidade_horarios(external_id)
        return parse_imported_schedules(payload.get("horarios"))


def resource_source_url(
    resource: SaudeSnapshotResource,
    year: int | None = None,
) -> str:
    endpoint, _, template = RESOURCE_DEFINITIONS[resource]
    if not template:
        suffix = f"?ano={year}" if is_year_scoped(resource) and year is not None else ""
        return f"/publico/saude-transparente/{endpoint}{suffix}"
    query = "&".join(
        f"{key}={value.format(year=year)}"
        for key, value in template.items()
        if year is not None
    )
    suffix = f"?{query}" if query else ""
    return f"/publico/saude-transparente/{endpoint}{suffix}"


def resource_params(
    resource: SaudeSnapshotResource,
    year: int | None,
) -> dict[str, str]:
    _, _, template = RESOURCE_DEFINITIONS[resource]
    if template:
        return {
            key: value.format(year=year)
            for key, value in template.items()
            if year is not None
        }
    if is_year_scoped(resource) and year is not None:
        return {"ano": str(year)}
    return {}


def is_default_scope_for_year(value: date, year: int) -> bool:
    return value == date(year, 1, 1)


def is_year_scoped(resource: SaudeSnapshotResource) -> bool:
    return RESOURCE_DEFINITIONS[resource][1]


def sync_error_label(
    resource: SaudeSnapshotResource,
    scope_year: int | None,
    exc: SaudeExternalAPIError,
) -> str:
    label = (
        f"{resource.value}:{scope_year}" if scope_year is not None else resource.value
    )
    return f"{label}: {exc.message}"


def _resolve_years(value: list[int] | None) -> list[int]:
    if value is not None:
        return value
    current_year = datetime.now(UTC).year
    return [current_year, current_year - 1]


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _to_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
