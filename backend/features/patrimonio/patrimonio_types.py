"""Patrimonio (Controle Patrimonial) bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PatrimonioItem(BaseModel):
    """Item de patrimônio (listagem)."""

    id: int | None = Field(default=None, description="ID único do item na API externa")
    tipo_bem: str = Field(..., description='Tipo do bem: "Móvel", "Imóvel" ou "Veículo"')
    descricao: str = Field(..., description="Descrição do bem")
    quantidade_anterior: int = Field(..., description="Quantidade saldo anterior")
    valor_anterior: float = Field(..., description="Valor saldo anterior")
    quantidade_adquiridos: int = Field(
        ..., description="Quantidade adquiridos no período"
    )
    valor_adquiridos: float = Field(..., description="Valor adquiridos no período")
    quantidade_baixados: int = Field(..., description="Quantidade baixados no período")
    valor_baixados: float = Field(..., description="Valor baixados no período")
    quantidade_atual: int = Field(..., description="Quantidade saldo atual")
    valor_atual: float = Field(..., description="Valor saldo atual")
    ano: int = Field(..., description="Ano de referência")


class PatrimonioResumoPorTipo(BaseModel):
    """Resumo por tipo de bem."""

    quantidade: int = Field(..., description="Quantidade total")
    valor: float = Field(..., description="Valor total")


class PatrimonioResumoAnual(BaseModel):
    """Resumo anual do patrimônio."""

    ano: int = Field(..., description="Ano de referência")
    total_bens: int = Field(..., description="Quantidade total de bens")
    total_valor: float = Field(..., description="Valor total dos bens")
    por_tipo: dict[str, PatrimonioResumoPorTipo] = Field(
        default_factory=dict,
        description='Resumo por tipo: {"Móvel": {...}, "Imóvel": {...}}',
    )


class PatrimonioListResponse(BaseModel):
    """Resposta da listagem de patrimônio."""

    items: list[PatrimonioItem] = Field(..., description="Lista de itens")
    quantidade: int = Field(..., description="Total de itens retornados")
    resumo: PatrimonioResumoAnual = Field(
        ..., description="Resumo anual do patrimônio"
    )
