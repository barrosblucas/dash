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
    ATENDIMENTOS_POR_SEXO = "atendimentos_por_sexo"
    PESSOAS_FISICAS_JURIDICAS = "pessoas_fisicas_juridicas"
    PESSOAS_POR_MES = "pessoas_por_mes"
    PROCEDIMENTOS_POR_TIPO = "procedimentos_por_tipo"
    VACINAS_POR_MES = "vacinas_por_mes"
    VACINAS_RANKING = "vacinas_ranking"
    VISITAS_MOTIVOS = "visitas_motivos"
    VISITAS_ACOMPANHAMENTO = "visitas_acompanhamento"
    VISITAS_BUSCA_ATIVA = "visitas_busca_ativa"
    VISITAS_CONTROLE_VETORIAL = "visitas_controle_vetorial"
    ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL = "atencao_primaria_atendimentos_mensal"
    ATENCAO_PRIMARIA_PROCEDIMENTOS = "atencao_primaria_procedimentos"
    ATENCAO_PRIMARIA_CBO = "atencao_primaria_cbo"
    SAUDE_BUCAL_ATENDIMENTOS_MENSAL = "saude_bucal_atendimentos_mensal"
    HOSPITAL_CENSO = "hospital_censo"
    HOSPITAL_PROCEDIMENTOS = "hospital_procedimentos"
    HOSPITAL_ATENDIMENTOS_MENSAL = "hospital_atendimentos_mensal"
    HOSPITAL_ATENDIMENTOS_CID = "hospital_atendimentos_cid"


class SaudeSyncTriggerType(StrEnum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    BOOTSTRAP = "bootstrap"


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


class SaudeTrendDirection(StrEnum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class SaudeLabelValueTrendItem(SaudeLabelValueItem):
    trend: SaudeTrendDirection | None = None
    previous_value: int | None = None


class SaudeMonthlySeriesItem(BaseModel):
    label: str
    value: int


class SaudeSeriesItem(BaseModel):
    label: str
    points: list[SaudeMonthlySeriesItem]


class SaudeMedicamentosDispensadosResponse(BaseModel):
    ranking: list[SaudeLabelValueItem]
    series_mensal_dispensacao: list[SaudeMonthlySeriesItem]
    series_mensal_atendimentos: list[SaudeMonthlySeriesItem]
    last_synced_at: datetime | None


class SaudePerfilEpidemiologicoResponse(BaseModel):
    quantitativos: list[SaudeLabelValueTrendItem]
    por_sexo: list[SaudeLabelValueItem]
    last_synced_at: datetime | None


class SaudeVacinacaoResponse(BaseModel):
    start_date: str | None
    end_date: str | None
    aplicadas_por_mes: list[SaudeMonthlySeriesItem]
    ranking_vacinas: list[SaudeLabelValueItem]
    total_aplicadas: int
    last_synced_at: datetime | None


class SaudeVisitasDomiciliaresResponse(BaseModel):
    start_date: str | None
    end_date: str | None
    motivos_visita: list[SaudeLabelValueItem]
    acompanhamento: list[SaudeLabelValueItem]
    busca_ativa: list[SaudeLabelValueItem]
    controle_vetorial: list[SaudeLabelValueItem]
    last_synced_at: datetime | None


class SaudeAtencaoPrimariaResponse(BaseModel):
    year: int
    start_date: str
    end_date: str
    atendimentos_por_mes: list[SaudeMonthlySeriesItem]
    procedimentos_por_especialidade: list[SaudeLabelValueItem]
    atendimentos_por_categoria: list[SaudeLabelValueItem]
    atendimentos_por_cbo: list[SaudeLabelValueItem]
    last_synced_at: datetime | None


class SaudeBucalResponse(BaseModel):
    year: int
    start_date: str | None
    end_date: str | None
    atendimentos_por_mes: list[SaudeMonthlySeriesItem]
    total_atendimentos: int
    last_synced_at: datetime | None


class SaudeHospitalCensoResponse(BaseModel):
    total_leitos: int | None
    ocupados: int | None
    livres: int | None
    taxa_ocupacao: float | None
    raw: dict[str, object]


class SaudeHospitalResponse(BaseModel):
    estabelecimento_id: int | None
    censo: SaudeHospitalCensoResponse | None
    procedimentos_realizados: list[SaudeLabelValueItem]
    total_procedimentos: int
    atendimentos_por_mes: list[SaudeMonthlySeriesItem]
    internacoes_por_mes: list[SaudeMonthlySeriesItem]
    internacoes_por_cid: list[SaudeLabelValueItem]
    media_permanencia: list[SaudeLabelValueItem]
    recursos_indisponiveis: list[str]
    last_synced_at: datetime | None


class SaudeFarmaciaResponse(BaseModel):
    year: int
    start_date: str | None
    end_date: str | None
    atendimentos_por_mes: list[SaudeMonthlySeriesItem]
    medicamentos_dispensados_por_mes: list[SaudeMonthlySeriesItem]
    top_medicamentos: list[SaudeLabelValueItem]
    total_atendimentos: int
    total_dispensados: int
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
