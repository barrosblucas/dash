"""Convênio bounded context — types and schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ConvenioItem(BaseModel):
    """Convênio list item."""

    numero: str = Field(..., description="Número do convênio (ex: 001/2026)")
    assinatura: str = Field(..., description="Data de assinatura (ex: 03/02/2026)")
    tipo: str = Field(..., description="Tipo: Concedido ou Recebido")
    esfera: str = Field(..., description="Esfera: Municipal, Estadual, Federal")
    concedente: str = Field(..., description="Nome do concedente")
    convenente: str = Field(..., description="Nome do convenente/favorecido")
    valor: float = Field(..., description="Valor do convênio")
    situacao: str = Field(..., description="Situação (ex: Em Vigor)")
    objeto: str = Field(..., description="Objeto do convênio")
    ano: int = Field(..., description="Ano de referência")


class ConvenioMovimentacao(BaseModel):
    """Movimentação mensal de convênio."""

    convenio: str = Field(..., description="Número do convênio")
    lancamento: str = Field(..., description="Número do lançamento ou empenho")
    entidade: str = Field(..., description="Entidade")
    data: str = Field(..., description="Data da movimentação")
    concedente: str = Field(..., description="Concedente")
    convenente: str = Field(..., description="Convenente/Favorecido")
    valor: float = Field(..., description="Valor da movimentação")
    mes: int = Field(..., description="Mês de referência (1-12)")
    tipo: Literal["receita", "despesa"] = Field(
        ..., description="Tipo: receita ou despesa"
    )


class ConvenioResumoAnual(BaseModel):
    """Resumo anual de convênios."""

    ano: int = Field(..., description="Ano de referência")
    quantidade_convenios: int = Field(..., description="Quantidade total de convênios")
    total_valor: float = Field(..., description="Valor total dos convênios")
    total_receitas: float = Field(..., description="Total de receitas do ano")
    total_despesas: float = Field(..., description="Total de despesas do ano")


class ConvenioListResponse(BaseModel):
    """Resposta da listagem de convênios."""

    items: list[ConvenioItem] = Field(..., description="Lista de convênios")
    quantidade: int = Field(..., description="Total de convênios retornados")
    resumo: ConvenioResumoAnual = Field(
        ..., description="Resumo anual dos convênios"
    )


class ConvenioMovimentacaoResponse(BaseModel):
    """Resposta da listagem de movimentações."""

    items: list[ConvenioMovimentacao] = Field(
        ..., description="Lista de movimentações"
    )
    quantidade: int = Field(..., description="Total de movimentações retornadas")
