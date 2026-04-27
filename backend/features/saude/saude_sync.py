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
from backend.shared.database.models import (
    SaudeAtencaoPrimariaModel,
    SaudeFarmaciaModel,
    SaudeVacinacaoModel,
)


class SaudeSyncService:
    """Orquestra sincronização dos recursos públicos do E-Saúde.

    Regra temporal: sync cobre [ano_atual, ano_anterior] por default.
    Dados anteriores permanecem imutáveis; ano corrente sofre overwrite a cada execução.
    """

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
        _populate_domain_tables(repo, payloads_to_persist, years, finished_at)
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
        f"{key}={(value.format(year=year) if year is not None else value)}"
        for key, value in sorted(template.items())
        if year is not None or "{year}" not in value
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
            key: value.format(year=year) if year is not None else value
            for key, value in template.items()
            if year is not None or "{year}" not in value
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

def _parse_chart_to_rows(
    payload: Any,
    dataset_label: str,
    scope_year: int | None = None,
) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    labels = payload.get("labels")
    datasets = payload.get("datasets")
    if not isinstance(labels, list) or not isinstance(datasets, list):
        return []
    # Apenas o primeiro dataset é indexado — compatível com chart_to_monthly_series_items()
    first_dataset = datasets[0] if datasets else None
    if not isinstance(first_dataset, dict):
        return []
    data = first_dataset.get("data")
    if not isinstance(data, list):
        return []
    rows: list[dict[str, Any]] = []
    for label, value in zip(labels, data, strict=False):
        if not isinstance(label, str):
            continue
        int_value = _coerce_int(value)
        ano, mes = _parse_label_year_month(label, scope_year)
        if ano is None:
            continue
        rows.append({
            "ano": ano, "mes": mes, "dataset": dataset_label,
            "label": label, "quantidade": int_value,
        })
    return rows

def _parse_label_year_month(label: str, default_year: int | None = None) -> tuple[int | None, int | None]:
    import re
    months_pt = {"janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}
    m = re.search(r"([a-zA-ZçÇ]+)\s+de\s+(\d{4})", label, re.IGNORECASE)
    if m:
        return int(m.group(2)), months_pt.get(m.group(1).lower())
    m = re.search(r"(\d{2})/(\d{4})", label)
    if m:
        return int(m.group(2)), int(m.group(1))
    m = re.search(r"(\d{4})-(\d{2})", label)
    if m:
        return int(m.group(1)), int(m.group(2))
    month_from_name = months_pt.get(label.strip().lower())
    if month_from_name is not None:
        return default_year, month_from_name
    m = re.search(r"(\d{4})", label)
    if m:
        return int(m.group(1)), None
    return default_year, None

def _coerce_int(value: Any) -> int:
    try:
        return int(float(str(value).replace(",", ".")))
    except (AttributeError, TypeError, ValueError):
        return 0

def _parse_coerce_int(value: Any) -> int:
    try:
        return int(float(str(value).replace(",", ".")))
    except (AttributeError, TypeError, ValueError):
        return 0

def _parse_coerce_int_or_none(value: Any) -> int | None:
    try:
        return int(float(str(value).replace(",", ".")))
    except (AttributeError, TypeError, ValueError):
        return None

def _populate_domain_tables(
    repo: SQLSaudeRepository,
    payloads: list[tuple[SaudeSnapshotResource, int | None, Any, str]],
    years: list[int],
    synced_at: datetime,
) -> int:
    """Popula as 7 tabelas de domínio a partir dos payloads coletados.
    Recursos listados em saude_resource_catalog.SNAPSHOT_ONLY_RESOURCES
    (hospital, visitas, perfil-demografico) permanecem apenas como snapshot."""
    total = 0
    for resource, scope_year, payload, _source_url in payloads:
        rows: list[dict[str, Any]] = []
        if resource == SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE:
            medicamentos = payload.get("medicamentos", []) if isinstance(payload, dict) else []
            for item in medicamentos:
                if not isinstance(item, dict):
                    continue
                rows.append({
                    "product_name": str(item.get("nome_do_produto") or ""),
                    "unit": str(item.get("unidade_do_produto")) if item.get("unidade_do_produto") else None,
                    "in_stock": _parse_coerce_int(item.get("em_estoque")),
                    "minimum_stock": _parse_coerce_int_or_none(item.get("estoque_minimo")),
                    "department": str(item.get("departamento")) if item.get("departamento") else None,
                    "establishment": str(item.get("estabelecimento")) if item.get("estabelecimento") else None,
                })
            total += repo.upsert_medicamentos(rows, synced_at)
        elif resource == SaudeSnapshotResource.QUANTITATIVOS:
            quant = payload.get("quantitativos", {}) if isinstance(payload, dict) else {}
            for _key, item in quant.items():
                if not isinstance(item, dict):
                    continue
                rows.append({
                    "dataset": "quantitativo",
                    "label": str(item.get("titulo") or "Sem título"),
                    "valor": _parse_coerce_int(item.get("valor")),
                })
            total += repo.replace_epidemiologico_rows(rows, synced_at)
        elif resource == SaudeSnapshotResource.ATENDIMENTOS_POR_SEXO:
            chart_rows = _parse_chart_to_rows(payload, "por_sexo", scope_year)
            rows = [
                {"dataset": "por_sexo", "label": r["label"], "valor": r["quantidade"]}
                for r in chart_rows
            ]
            total += repo.replace_epidemiologico_rows(rows, synced_at)
        elif resource == SaudeSnapshotResource.MEDICAMENTOS_RANKING:
            year = scope_year or max(years) if years else datetime.now(UTC).year
            chart_rows = _parse_chart_to_rows(payload, "ranking", year)
            for r in chart_rows:
                r["mes"] = None
            total += repo.replace_domain_rows(SaudeFarmaciaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL:
            chart_rows = _parse_chart_to_rows(payload, "dispensados_mensal", scope_year)
            total += repo.replace_domain_rows(SaudeFarmaciaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL:
            chart_rows = _parse_chart_to_rows(payload, "atendimentos_mensal", scope_year)
            total += repo.replace_domain_rows(SaudeFarmaciaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.VACINAS_POR_MES:
            chart_rows = _parse_chart_to_rows(payload, "mensal", scope_year)
            total += repo.replace_domain_rows(SaudeVacinacaoModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.VACINAS_RANKING:
            year = scope_year or max(years) if years else datetime.now(UTC).year
            chart_rows = _parse_chart_to_rows(payload, "ranking", year)
            for r in chart_rows:
                r["mes"] = None
            total += repo.replace_domain_rows(SaudeVacinacaoModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL:
            chart_rows = _parse_chart_to_rows(payload, "atendimentos_mensal", scope_year)
            total += repo.replace_domain_rows(SaudeAtencaoPrimariaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS:
            year = scope_year or max(years) if years else datetime.now(UTC).year
            chart_rows = _parse_chart_to_rows(payload, "procedimentos", year)
            for r in chart_rows:
                r["mes"] = None
            total += repo.replace_domain_rows(SaudeAtencaoPrimariaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO:
            year = scope_year or max(years) if years else datetime.now(UTC).year
            chart_rows = _parse_chart_to_rows(payload, "cbo", year)
            for r in chart_rows:
                r["mes"] = None
            total += repo.replace_domain_rows(SaudeAtencaoPrimariaModel, chart_rows, synced_at)
        elif resource == SaudeSnapshotResource.SAUDE_BUCAL_ATENDIMENTOS_MENSAL:
            chart_rows = _parse_chart_to_rows(payload, "bucal_mensal", scope_year)
            rows = [
                {"ano": r["ano"], "mes": r.get("mes"), "label": r["label"], "quantidade": r["quantidade"]}
                for r in chart_rows
            ]
            total += repo.replace_bucal_rows(rows, synced_at)
        elif resource == SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO:
            year = scope_year or max(years) if years else datetime.now(UTC).year
            chart_rows = _parse_chart_to_rows(payload, "procedimentos", year)
            rows = [
                {"label": r["label"], "quantidade": r["quantidade"]}
                for r in chart_rows
            ]
            total += repo.replace_procedimentos_rows(rows, synced_at)
    return total
