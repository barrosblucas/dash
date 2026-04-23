"""Schemas do bounded context saude."""

from __future__ import annotations

from datetime import datetime, time
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SaudeDayOfWeek(StrEnum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class SaudeSnapshotResource(StrEnum):
    MEDICAMENTOS_ESTOQUE = "medicamentos_estoque"
    MEDICAMENTOS_RANKING = "medicamentos_ranking"
    MEDICAMENTOS_DISPENSADOS_MENSAL = "medicamentos_dispensados_mensal"
    MEDICAMENTOS_ATENDIMENTOS_MENSAL = "medicamentos_atendimentos_mensal"
    QUANTITATIVOS = "quantitativos"
    PESSOAS_FISICAS_JURIDICAS = "pessoas_fisicas_juridicas"
    PESSOAS_POR_MES = "pessoas_por_mes"
    PROCEDIMENTOS_POR_TIPO = "procedimentos_por_tipo"


class SaudeSyncTriggerType(StrEnum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class SaudeUnitBaseRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    unit_type: str = Field(..., min_length=2, max_length=120)
    address: str = Field(..., min_length=2, max_length=255)
    neighborhood: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_active: bool = True


class SaudeUnitCreateRequest(SaudeUnitBaseRequest):
    external_id: int | None = None
    source: str = Field(default="manual", min_length=2, max_length=60)


class SaudeUnitUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    unit_type: str | None = Field(default=None, min_length=2, max_length=120)
    address: str | None = Field(default=None, min_length=2, max_length=255)
    neighborhood: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_active: bool | None = None


class SaudeUnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    unit_type: str
    address: str
    neighborhood: str | None
    phone: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    is_active: bool
    external_id: int | None
    source: str
    created_at: datetime
    updated_at: datetime


class SaudeUnitListResponse(BaseModel):
    items: list[SaudeUnitResponse]
    total: int


class SaudeUnitScheduleItem(BaseModel):
    day_of_week: SaudeDayOfWeek
    opens_at: time | None = None
    closes_at: time | None = None
    is_closed: bool = False

    @field_validator("closes_at")
    @classmethod
    def validate_closes_at(cls, value: time | None, info: object) -> time | None:
        data = getattr(info, "data", {})
        opens_at = data.get("opens_at") if isinstance(data, dict) else None
        is_closed = data.get("is_closed") if isinstance(data, dict) else False
        if is_closed:
            return value
        if opens_at is None or value is None:
            raise ValueError("opens_at e closes_at são obrigatórios quando aberto")
        if value <= opens_at:
            raise ValueError("closes_at deve ser maior que opens_at")
        return value


class SaudeUnitScheduleUpdateRequest(BaseModel):
    schedules: list[SaudeUnitScheduleItem] = Field(default_factory=list)


class SaudeUnitScheduleResponse(BaseModel):
    unit_id: int
    schedules: list[SaudeUnitScheduleItem]


class SaudeImportResponse(BaseModel):
    imported: int
    updated: int
    total: int


class SaudeMedicationItem(BaseModel):
    product_name: str
    unit: str | None
    in_stock: int
    minimum_stock: int | None
    department: str | None
    establishment: str | None
    below_minimum: bool


class SaudeMedicationStockResponse(BaseModel):
    items: list[SaudeMedicationItem]
    total: int
    page: int
    page_size: int
    total_abaixo_minimo: int
    last_synced_at: datetime | None


class SaudeLabelValueItem(BaseModel):
    label: str
    value: int


class SaudeMonthlySeriesItem(BaseModel):
    label: str
    value: int


class SaudeMedicamentosDispensadosResponse(BaseModel):
    ranking: list[SaudeLabelValueItem]
    series_mensal_dispensacao: list[SaudeMonthlySeriesItem]
    series_mensal_atendimentos: list[SaudeMonthlySeriesItem]
    last_synced_at: datetime | None


class SaudePerfilEpidemiologicoResponse(BaseModel):
    quantitativos: list[SaudeLabelValueItem]
    por_sexo: list[SaudeLabelValueItem]
    last_synced_at: datetime | None


class SaudePerfilDemograficoResponse(BaseModel):
    tipos_pessoa: list[SaudeLabelValueItem]
    pessoas_por_mes: list[SaudeMonthlySeriesItem]
    last_synced_at: datetime | None


class SaudeProcedimentosTipoResponse(BaseModel):
    items: list[SaudeLabelValueItem]
    last_synced_at: datetime | None


class SaudeSnapshotStatusItem(BaseModel):
    resource: SaudeSnapshotResource
    scope_year: int | None
    synced_at: datetime


class SaudeSyncLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trigger_type: SaudeSyncTriggerType
    status: str
    started_at: datetime
    finished_at: datetime | None
    resources_json: str
    years_json: str
    error_message: str | None


class SaudeSyncStatusResponse(BaseModel):
    running: bool
    next_run_at: datetime | None
    last_success_at: datetime | None
    snapshots: list[SaudeSnapshotStatusItem]
    recent_logs: list[SaudeSyncLogResponse]


class SaudeSyncRequest(BaseModel):
    years: list[int] | None = None
    resources: list[SaudeSnapshotResource] | None = None

    @field_validator("years")
    @classmethod
    def validate_years(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return None
        normalized = sorted(set(value), reverse=True)
        for year in normalized:
            if year < 2000 or year > 2100:
                raise ValueError("years deve conter anos entre 2000 e 2100")
        return normalized

    @field_validator("resources")
    @classmethod
    def dedupe_resources(
        cls, value: list[SaudeSnapshotResource] | None
    ) -> list[SaudeSnapshotResource] | None:
        if value is None:
            return None
        return list(dict.fromkeys(value))


class SaudeSyncResponse(BaseModel):
    status: str
    years: list[int]
    resources: list[SaudeSnapshotResource]
    synced_resources: int
    failed_resources: int
    errors: list[str]
    started_at: datetime
    finished_at: datetime
