"""Diaria (Diárias e Passagens) bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DiariaItem(BaseModel):
    """Item de diária/passagem (listagem)."""

    numero_empenho: int = Field(..., description="Número de empenho")
    numero_liquidacao: int = Field(..., description="Número de liquidação")
    nome: str = Field(..., description="Nome do servidor")
    historico: str = Field(..., description="Histórico/descrição da diária")
    destino: str = Field(..., description="Cidade de destino")
    periodo: str = Field(..., description="Período (ex: 12/01/2026 a 12/01/2026)")
    valor_total: float = Field(..., description="Valor total da diária")
    valor_devolvido: float = Field(..., description="Valor devolvido")
    ano: int = Field(..., description="Ano de referência")
    mes: int = Field(..., description="Mês de referência")


class DiariaResumoMensal(BaseModel):
    """Resumo mensal de diárias."""

    mes: int = Field(..., description="Mês de referência (1-12)")
    total_valor: float = Field(..., description="Valor total no mês")
    quantidade: int = Field(..., description="Quantidade de diárias no mês")


class DiariaResumoAnual(BaseModel):
    """Resumo anual de diárias."""

    ano: int = Field(..., description="Ano de referência")
    quantidade_total: int = Field(..., description="Quantidade total de diárias")
    total_valor: float = Field(..., description="Valor total das diárias")
    total_devolvido: float = Field(..., description="Valor total devolvido")
    evolucao_mensal: list[DiariaResumoMensal] = Field(
        default_factory=list, description="Evolução mensal"
    )


class DiariaListResponse(BaseModel):
    """Resposta da listagem de diárias."""

    items: list[DiariaItem] = Field(..., description="Lista de diárias")
    quantidade: int = Field(..., description="Total de diárias retornadas")
    resumo: DiariaResumoAnual = Field(
        ..., description="Resumo anual das diárias"
    )
