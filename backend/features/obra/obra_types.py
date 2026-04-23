"""Schemas do bounded context obra."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ObraStatus(StrEnum):
    EM_ANDAMENTO = "em_andamento"
    PARALISADA = "paralisada"
    CONCLUIDA = "concluida"


class MedicaoPayload(BaseModel):
    sequencia: int = Field(..., ge=1)
    mes_referencia: int = Field(..., ge=1, le=12)
    ano_referencia: int = Field(..., ge=2000, le=2100)
    valor_medicao: Decimal = Field(..., ge=0)
    observacao: str | None = Field(default=None, max_length=2000)


class MedicaoResponse(MedicaoPayload):
    id: int


class ObraWriteRequest(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=255)
    descricao: str = Field(..., min_length=3)
    status: ObraStatus
    secretaria: str = Field(..., min_length=1, max_length=255)
    orgao: str = Field(..., min_length=1, max_length=255)
    contrato: str = Field(..., min_length=1, max_length=255)
    tipo_obra: str = Field(..., min_length=1, max_length=255)
    modalidade: str = Field(..., min_length=1, max_length=255)
    fonte_recurso: str = Field(..., min_length=1, max_length=255)
    data_inicio: date
    previsao_termino: date | None = None
    data_termino: date | None = None
    logradouro: str = Field(..., min_length=1, max_length=255)
    bairro: str = Field(..., min_length=1, max_length=255)
    cep: str = Field(..., min_length=1, max_length=20)
    numero: str = Field(..., min_length=1, max_length=20)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    valor_orcamento: Decimal | None = Field(default=None, ge=0)
    valor_original: Decimal | None = Field(default=None, ge=0)
    valor_aditivo: Decimal | None = Field(default=None, ge=0)
    valor_homologado: Decimal | None = Field(default=None, ge=0)
    valor_contrapartida: Decimal | None = Field(default=None, ge=0)
    valor_convenio: Decimal | None = Field(default=None, ge=0)
    progresso_fisico: Decimal | None = Field(default=None, ge=0, le=100)
    progresso_financeiro: Decimal | None = Field(default=None, ge=0, le=100)
    medicoes: list[MedicaoPayload] = Field(default_factory=list)


class ObraResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hash: str
    titulo: str
    descricao: str
    status: ObraStatus
    secretaria: str
    orgao: str
    contrato: str
    tipo_obra: str
    modalidade: str
    fonte_recurso: str
    data_inicio: date
    previsao_termino: date | None = None
    data_termino: date | None = None
    logradouro: str
    bairro: str
    cep: str
    numero: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    valor_orcamento: Decimal | None = None
    valor_original: Decimal | None = None
    valor_aditivo: Decimal | None = None
    valor_homologado: Decimal | None = None
    valor_contrapartida: Decimal | None = None
    valor_convenio: Decimal | None = None
    progresso_fisico: Decimal | None = None
    progresso_financeiro: Decimal | None = None
    valor_economizado: Decimal | None
    valor_medido_total: Decimal
    created_at: datetime
    updated_at: datetime
    medicoes: list[MedicaoResponse]


class ObraListResponse(BaseModel):
    obras: list[ObraResponse]
    total: int
