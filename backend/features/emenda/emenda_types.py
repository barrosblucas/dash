"""Emenda (Emendas Parlamentares) bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class EmendaItem(BaseModel):
    """Item de emenda parlamentar (listagem)."""

    emenda: str = Field(..., description="Identificação da emenda (ex: EMENDA 001/2025)")
    tipo_emenda: str = Field(..., description="Tipo da emenda")
    numero_protocolo: str = Field(..., description="Número do protocolo")
    descricao: str = Field(..., description="Descrição da emenda")
    valor: float = Field(..., description="Valor da emenda")
    detalhes_link: str = Field(default="", description="Link para página de detalhes")
    ano: int = Field(..., description="Ano de referência")


class EmendaResumoAnual(BaseModel):
    """Resumo anual de emendas parlamentares."""

    ano: int = Field(..., description="Ano de referência")
    quantidade_emendas: int = Field(..., description="Quantidade total de emendas")
    total_valor: float = Field(..., description="Valor total das emendas")
    por_tipo: dict[str, float] = Field(
        default_factory=dict,
        description="Valor total agrupado por tipo de emenda",
    )


class EmendaListResponse(BaseModel):
    """Resposta da listagem de emendas parlamentares."""

    items: list[EmendaItem] = Field(..., description="Lista de emendas")
    quantidade: int = Field(..., description="Total de emendas retornadas")
    resumo: EmendaResumoAnual = Field(
        ..., description="Resumo anual das emendas"
    )
