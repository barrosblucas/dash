"""Helpers HTTP compartilhados da feature saude."""

from __future__ import annotations

from datetime import datetime
from typing import Any, cast

from fastapi import HTTPException, status

from backend.features.saude.saude_adapter import SaudeExternalAPIError
from backend.features.saude.saude_types import (
    SaudeUnitResponse,
    SaudeUnitScheduleItem,
    SaudeUnitScheduleResponse,
)
from backend.shared.database.models import SaudeUnidadeHorarioModel, SaudeUnidadeModel


def unit_response(model: SaudeUnidadeModel) -> SaudeUnitResponse:
    return SaudeUnitResponse.model_validate(model)


def schedule_response(
    unit_id: int,
    rows: list[SaudeUnidadeHorarioModel],
) -> SaudeUnitScheduleResponse:
    return SaudeUnitScheduleResponse(
        unit_id=unit_id,
        schedules=[
            SaudeUnitScheduleItem(
                day_of_week=cast(Any, row.day_of_week),
                opens_at=cast(Any, row.opens_at),
                closes_at=cast(Any, row.closes_at),
                is_closed=bool(row.is_closed),
            )
            for row in rows
        ],
    )


def not_found(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def external_error(exc: SaudeExternalAPIError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message)


def parse_iso_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def coerce_int(value: Any) -> int:
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return 0


def coerce_optional_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return coerce_int(value)


def below_minimum(in_stock: Any, minimum_stock: Any) -> bool:
    minimum = coerce_optional_int(minimum_stock)
    if minimum is None:
        return False
    return coerce_int(in_stock) < minimum


def matches_medicamento(
    item: dict[str, Any],
    *,
    search: str | None,
    estabelecimento: str | None,
) -> bool:
    if search and search.lower() not in str(item.get("nome_do_produto", "")).lower():
        return False
    if estabelecimento and estabelecimento.lower() not in str(
        item.get("estabelecimento", "")
    ).lower():
        return False
    return True
