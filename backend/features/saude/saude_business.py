"""Lógica de domínio do bounded context saude."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.features.saude.saude_adapter import ESaudeClient, SaudeExternalAPIError
from backend.features.saude.saude_data import SQLSaudeRepository
from backend.features.saude.saude_types import (
    SaudeDayOfWeek,
    SaudeLabelValueItem,
    SaudeMonthlySeriesItem,
    SaudeSnapshotResource,
    SaudeSyncRequest,
    SaudeSyncResponse,
    SaudeSyncTriggerType,
    SaudeUnitCreateRequest,
    SaudeUnitScheduleItem,
    SaudeUnitUpdateRequest,
)

_DAY_ORDER = [
    SaudeDayOfWeek.MONDAY,
    SaudeDayOfWeek.TUESDAY,
    SaudeDayOfWeek.WEDNESDAY,
    SaudeDayOfWeek.THURSDAY,
    SaudeDayOfWeek.FRIDAY,
    SaudeDayOfWeek.SATURDAY,
    SaudeDayOfWeek.SUNDAY,
]


class SaudeSyncService:
    """Orquestra sincronização mínima dos recursos de Saúde Transparente."""

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
        resources = request.resources or list(SaudeSnapshotResource)
        started_at = _utc_now_naive()
        log = repo.create_sync_log(
            trigger_type=trigger_type,
            status="running",
            started_at=started_at,
            resources=resources,
            years=years,
        )

        errors: list[str] = []
        synced_resources = 0
        for resource in resources:
            scope_years: list[int | None]
            if resource in _YEAR_SCOPED_RESOURCES:
                scope_years = [int(item) for item in years]
            else:
                scope_years = [None]
            for scope_year in scope_years:
                try:
                    payload = await self._fetch_resource_payload(resource, scope_year)
                    repo.replace_snapshot(
                        resource=resource,
                        payload=payload,
                        synced_at=_utc_now_naive(),
                        scope_year=scope_year,
                        source_url=_resource_source_url(resource),
                    )
                    synced_resources += 1
                except SaudeExternalAPIError as exc:
                    label = (
                        f"{resource.value}:{scope_year}"
                        if scope_year is not None
                        else resource.value
                    )
                    errors.append(f"{label}: {exc.message}")

        finished_at = _utc_now_naive()
        status = (
            "success"
            if not errors
            else ("partial" if synced_resources > 0 else "error")
        )
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

    async def _build_imported_schedules(
        self, external_id: int
    ) -> list[SaudeUnitScheduleItem]:
        payload = await self._client.fetch_unidade_horarios(external_id)
        horarios = payload.get("horarios")
        return parse_imported_schedules(horarios)

    async def _fetch_resource_payload(
        self,
        resource: SaudeSnapshotResource,
        year: int | None,
    ) -> Any:
        if resource is SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE:
            return await self._client.fetch_medicamentos_tabela()
        if resource is SaudeSnapshotResource.MEDICAMENTOS_RANKING:
            return await self._client.fetch_chart(
                "lista-de-medicamentos-com-mais-saidas"
            )
        if resource is SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL:
            return await self._client.fetch_chart(
                "quantidade-de-medicamentos-dispensados-por-mes"
            )
        if resource is SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL:
            if year is None:
                raise SaudeExternalAPIError(
                    "Ano obrigatório para medicamentos_atendimentos_mensal"
                )
            return await self._client.fetch_chart(
                "quantidade-de-atendimentos-medicamentos-por-mes",
                year=year,
            )
        if resource is SaudeSnapshotResource.QUANTITATIVOS:
            return await self._client.fetch_quantitativos()
        if resource is SaudeSnapshotResource.PESSOAS_FISICAS_JURIDICAS:
            return await self._client.fetch_chart(
                "quantidade-de-pessoas-fisicas-e-juridicas"
            )
        if resource is SaudeSnapshotResource.PESSOAS_POR_MES:
            return await self._client.fetch_chart("quantidade-de-pessoas-por-mes")
        return await self._client.fetch_chart("quantidade-de-procedimentos-por-tipo")


_YEAR_SCOPED_RESOURCES = {SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL}


def build_unit_create_request(payload: dict[str, Any]) -> SaudeUnitCreateRequest:
    return SaudeUnitCreateRequest(
        name=str(
            payload.get("title") or payload.get("nome") or "Unidade sem nome"
        ).strip(),
        unit_type=str(
            payload.get("no_tipo_unidade_saude") or payload.get("tipo") or "Unidade"
        ).strip(),
        address=str(
            payload.get("logradouro")
            or payload.get("endereco")
            or "Endereço não informado"
        ).strip(),
        neighborhood=_clean_nullable_text(payload.get("bairro")),
        phone=_clean_nullable_text(payload.get("telefone")),
        latitude=_to_decimal(payload.get("lat")),
        longitude=_to_decimal(payload.get("lng")),
        is_active=True,
        external_id=_to_int(payload.get("id")),
        source="imported_esaude",
    )


def unit_payload_to_update(payload: SaudeUnitCreateRequest) -> SaudeUnitUpdateRequest:
    return SaudeUnitUpdateRequest(
        name=payload.name,
        unit_type=payload.unit_type,
        address=payload.address,
        neighborhood=payload.neighborhood,
        phone=payload.phone,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_active=payload.is_active,
    )


def parse_imported_schedules(payload: Any) -> list[SaudeUnitScheduleItem]:
    if not isinstance(payload, list):
        return []
    schedules: list[SaudeUnitScheduleItem] = []
    seen_days: set[str] = set()
    for item in payload:
        if not isinstance(item, dict):
            continue
        day = normalize_day_of_week(
            item.get("dia_da_semana") or item.get("day_of_week")
        )
        if day is None or day.value in seen_days:
            continue
        opens_at = item.get("horario_de_funcionamento_inicial") or item.get("opens_at")
        closes_at = item.get("horario_de_funcionamento_final") or item.get("closes_at")
        schedules.append(
            SaudeUnitScheduleItem(
                day_of_week=day,
                opens_at=opens_at,
                closes_at=closes_at,
                is_closed=opens_at is None and closes_at is None,
            )
        )
        seen_days.add(day.value)
    return sorted(schedules, key=lambda item: _DAY_ORDER.index(item.day_of_week))


def normalize_day_of_week(value: Any) -> SaudeDayOfWeek | None:
    normalized = str(value or "").strip().lower()
    mapping = {
        "segunda": SaudeDayOfWeek.MONDAY,
        "segunda-feira": SaudeDayOfWeek.MONDAY,
        "monday": SaudeDayOfWeek.MONDAY,
        "terça": SaudeDayOfWeek.TUESDAY,
        "terca": SaudeDayOfWeek.TUESDAY,
        "terça-feira": SaudeDayOfWeek.TUESDAY,
        "terca-feira": SaudeDayOfWeek.TUESDAY,
        "tuesday": SaudeDayOfWeek.TUESDAY,
        "quarta": SaudeDayOfWeek.WEDNESDAY,
        "quarta-feira": SaudeDayOfWeek.WEDNESDAY,
        "wednesday": SaudeDayOfWeek.WEDNESDAY,
        "quinta": SaudeDayOfWeek.THURSDAY,
        "quinta-feira": SaudeDayOfWeek.THURSDAY,
        "thursday": SaudeDayOfWeek.THURSDAY,
        "sexta": SaudeDayOfWeek.FRIDAY,
        "sexta-feira": SaudeDayOfWeek.FRIDAY,
        "friday": SaudeDayOfWeek.FRIDAY,
        "sábado": SaudeDayOfWeek.SATURDAY,
        "sabado": SaudeDayOfWeek.SATURDAY,
        "saturday": SaudeDayOfWeek.SATURDAY,
        "domingo": SaudeDayOfWeek.SUNDAY,
        "sunday": SaudeDayOfWeek.SUNDAY,
    }
    return mapping.get(normalized)


def chart_to_label_value_items(payload: Any) -> list[SaudeLabelValueItem]:
    labels = payload.get("labels") if isinstance(payload, dict) else None
    datasets = payload.get("datasets") if isinstance(payload, dict) else None
    if not isinstance(labels, list) or not isinstance(datasets, list) or not datasets:
        return []
    first_dataset = datasets[0] if isinstance(datasets[0], dict) else None
    data = first_dataset.get("data") if isinstance(first_dataset, dict) else None
    if not isinstance(data, list):
        return []
    items: list[SaudeLabelValueItem] = []
    for label, value in zip(labels, data, strict=False):
        items.append(SaudeLabelValueItem(label=str(label), value=_coerce_int(value)))
    return items


def chart_to_monthly_series_items(
    payload: Any,
    *,
    year: int | None = None,
) -> list[SaudeMonthlySeriesItem]:
    items = [
        SaudeMonthlySeriesItem(label=item.label, value=item.value)
        for item in chart_to_label_value_items(payload)
    ]
    if year is None:
        return items
    return [item for item in items if str(year) in item.label]


def quantitativos_to_items(payload: Any) -> list[SaudeLabelValueItem]:
    quantitativos = payload.get("quantitativos") if isinstance(payload, dict) else None
    if not isinstance(quantitativos, dict):
        return []
    items: list[SaudeLabelValueItem] = []
    for item in quantitativos.values():
        if not isinstance(item, dict):
            continue
        items.append(
            SaudeLabelValueItem(
                label=str(item.get("titulo") or "Sem título"),
                value=_coerce_int(item.get("valor")),
            )
        )
    return items


def quantitativos_to_gender_items(payload: Any) -> list[SaudeLabelValueItem]:
    quantitativos = payload.get("quantitativos") if isinstance(payload, dict) else None
    if not isinstance(quantitativos, dict):
        return []
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


def _resource_source_url(resource: SaudeSnapshotResource) -> str:
    base = "/publico/saude-transparente"
    mapping = {
        SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE: f"{base}/medicamentos-tabela",
        SaudeSnapshotResource.MEDICAMENTOS_RANKING: f"{base}/buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas",
        SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL: f"{base}/buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes",
        SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL: f"{base}/buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes",
        SaudeSnapshotResource.QUANTITATIVOS: f"{base}/buscar-dados-quantitativos",
        SaudeSnapshotResource.PESSOAS_FISICAS_JURIDICAS: f"{base}/buscar-dados-do-chart/quantidade-de-pessoas-fisicas-e-juridicas",
        SaudeSnapshotResource.PESSOAS_POR_MES: f"{base}/buscar-dados-do-chart/quantidade-de-pessoas-por-mes",
        SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO: f"{base}/buscar-dados-do-chart/quantidade-de-procedimentos-por-tipo",
    }
    return mapping[resource]


def _resolve_years(value: list[int] | None) -> list[int]:
    if value is not None:
        return value
    current_year = datetime.now(UTC).year
    return [current_year, current_year - 1]


def _utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _clean_nullable_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_decimal(value: Any) -> Any:
    if value in (None, ""):
        return None
    return value


def _coerce_int(value: Any) -> int:
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return 0
