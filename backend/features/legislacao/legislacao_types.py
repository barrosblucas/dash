"""
Legislacao bounded context — types and schemas.
"""

from __future__ import annotations

from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field


class StatusLegislacao(StrEnum):
    ATIVA = "ATIVA"
    REVOGADA = "REVOGADA"
    ALTERADA = "ALTERADA"


class TipoLegislacao(StrEnum):
    LEI = "LEI"
    LEI_COMPLEMENTAR = "LEI_COMPLEMENTAR"
    DECRETO = "DECRETO"
    DECRETO_LEI = "DECRETO_LEI"
    PORTARIA = "PORTARIA"
    RESOLUCAO = "RESOLUCAO"
    EMENDA = "EMENDA"


class LegislacaoItem(BaseModel):
    """Schema para item na listagem de legislações."""

    id: str
    tipo: TipoLegislacao
    numero: str
    ano: int
    ementa: str
    data_publicacao: str
    data_promulgacao: str | None = None
    status: StatusLegislacao
    autor: str | None = None


class LegislacaoDetalhe(BaseModel):
    """Schema para detalhe completo de uma legislação."""

    id: str
    tipo: TipoLegislacao
    numero: str
    ano: int
    ementa: str
    texto_integral: str
    data_publicacao: str
    data_promulgacao: str | None = None
    data_vigencia_inicio: str | None = None
    data_vigencia_fim: str | None = None
    status: StatusLegislacao
    autor: str | None = None
    sancionado_por: str | None = None
    origem: str | None = None
    legislacao_vinculada: list[str] | None = None
    url_arquivo: str | None = None


class LegislacaoListResponse(BaseModel):
    """Resposta paginada de legislações."""

    items: list[LegislacaoItem]
    total: int
    page: int
    size: int


class LegislacaoCreateRequest(BaseModel):
    tipo: TipoLegislacao
    numero: str = Field(..., min_length=1, max_length=20)
    ano: int = Field(..., ge=2000, le=2100)
    ementa: str = Field(..., min_length=3)
    texto_integral: str | None = None
    data_publicacao: date
    data_promulgacao: date | None = None
    data_vigencia_inicio: date | None = None
    data_vigencia_fim: date | None = None
    status: StatusLegislacao = StatusLegislacao.ATIVA
    autor: str | None = None
    sancionado_por: str | None = None
    origem: str | None = None
    legislacao_vinculada: list[str] | None = None
    url_arquivo: str | None = None


class LegislacaoUpdateRequest(BaseModel):
    tipo: TipoLegislacao | None = None
    numero: str | None = Field(default=None, min_length=1, max_length=20)
    ano: int | None = Field(default=None, ge=2000, le=2100)
    ementa: str | None = Field(default=None, min_length=3)
    texto_integral: str | None = None
    data_publicacao: date | None = None
    data_promulgacao: date | None = None
    data_vigencia_inicio: date | None = None
    data_vigencia_fim: date | None = None
    status: StatusLegislacao | None = None
    autor: str | None = None
    sancionado_por: str | None = None
    origem: str | None = None
    legislacao_vinculada: list[str] | None = None
    url_arquivo: str | None = None



