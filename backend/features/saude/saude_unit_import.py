"""Normalização de importação das unidades de saúde."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from backend.features.saude.saude_types import (
    SaudeDayOfWeek,
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


def build_unit_create_request(payload: dict[str, Any]) -> SaudeUnitCreateRequest:
    return SaudeUnitCreateRequest(
        name=str(payload.get("title") or payload.get("nome") or "Unidade sem nome").strip(),
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
        day = normalize_day_of_week(item.get("dia_da_semana") or item.get("day_of_week"))
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
    return mapping.get(str(value or "").strip().lower())


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


def _to_decimal(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None
