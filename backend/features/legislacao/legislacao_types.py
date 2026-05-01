"""
Legislacao bounded context — types and schemas.
"""
from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel


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
