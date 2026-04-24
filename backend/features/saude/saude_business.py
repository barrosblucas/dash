"""Compatibilidade para imports legados da feature saude."""

from __future__ import annotations

from backend.features.saude.saude_snapshot_mapper import (
    chart_to_label_value_items,
    chart_to_monthly_series_items,
    hospital_censo_from_payload,
    quantitativos_to_gender_items,
    quantitativos_to_items_with_trend,
    sum_values,
)
from backend.features.saude.saude_sync import (
    SaudeSyncService,
    is_default_scope_for_year,
)
from backend.features.saude.saude_unit_import import (
    build_unit_create_request,
    normalize_day_of_week,
    parse_imported_schedules,
    unit_payload_to_update,
)

__all__ = [
    "SaudeSyncService",
    "build_unit_create_request",
    "chart_to_label_value_items",
    "chart_to_monthly_series_items",
    "hospital_censo_from_payload",
    "is_default_scope_for_year",
    "normalize_day_of_week",
    "parse_imported_schedules",
    "quantitativos_to_gender_items",
    "quantitativos_to_items_with_trend",
    "sum_values",
    "unit_payload_to_update",
]
