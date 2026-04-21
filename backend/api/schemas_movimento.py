"""Schemas Pydantic para movimento extra orçamentário."""

from typing import Literal

from pydantic import BaseModel, Field


class MovimentoExtraItem(BaseModel):
    """Item de movimento extra orçamentário."""

    codigo: int = Field(..., description="Código do movimento")
    ent_codigo: int = Field(..., description="Código da entidade")
    descricao: str = Field(..., description="Descrição do movimento")
    fornecedor: str = Field(..., description="Nome do fornecedor")
    tipo: Literal["R", "D"] = Field(
        ..., description="Tipo: R=Receita, D=Despesa"
    )
    valor_recebido: float = Field(
        ..., description="Valor recebido/pago"
    )
    mes: int = Field(..., description="Mês de referência")


class FundoResumo(BaseModel):
    """Resumo agrupado por fundo municipal."""

    fundo: str = Field(..., description="Sigla do fundo (ex: FUNDEB)")
    descricao_completa: str = Field(
        ..., description="Nome completo do fundo"
    )
    total_receitas: float = Field(
        ..., description="Total de receitas do fundo"
    )
    total_despesas: float = Field(
        ..., description="Total de despesas do fundo"
    )
    quantidade_itens: int = Field(
        ..., description="Quantidade de itens no fundo"
    )


class MovimentoExtraResponse(BaseModel):
    """Resposta consolidada do movimento extra orçamentário."""

    items: list[MovimentoExtraItem] = Field(
        ..., description="Lista de itens do movimento"
    )
    total_receitas: float = Field(
        ..., description="Soma de valor_recebido para tipo=R"
    )
    total_despesas: float = Field(
        ..., description="Soma de valor_recebido para tipo=D"
    )
    saldo: float = Field(
        ..., description="Saldo (total_receitas - total_despesas)"
    )
    quantidade: int = Field(
        ..., description="Total de itens retornados"
    )
    fundos_resumo: list[FundoResumo] = Field(
        ..., description="Resumo agrupado por fundo municipal"
    )
    insights_receitas: list["InsightItem"] = Field(
        default_factory=list,
        description="Top categorias de receitas",
    )
    insights_despesas: list["InsightItem"] = Field(
        default_factory=list,
        description="Top categorias de despesas",
    )


class InsightItem(BaseModel):
    """Item de insight agregado por categoria de descrição."""

    categoria: str = Field(
        ..., description="Nome da categoria (ex: 'Total INSS', 'Total IRRF')"
    )
    valor: float = Field(
        ..., description="Soma dos valores da categoria"
    )
    percentual: float = Field(
        ..., description="Percentual em relação ao total do tipo (R ou D)"
    )
    quantidade: int = Field(
        ..., description="Quantidade de itens nesta categoria"
    )
    descricao: str = Field(
        ..., description="Explicação da categoria para o cidadão"
    )


class ResumoMensalItem(BaseModel):
    """Totais de um mês específico."""

    mes: int = Field(..., description="Mês (1-12)")
    total_receitas: float = Field(..., description="Total receitas do mês")
    total_despesas: float = Field(..., description="Total despesas do mês")
    saldo: float = Field(..., description="Saldo do mês")


class MovimentoExtraAnualResponse(BaseModel):
    """Resposta consolidada anual do movimento extra orçamentário."""

    ano: int = Field(..., description="Ano de referência")
    total_receitas: float = Field(..., description="Total de receitas do ano")
    total_despesas: float = Field(..., description="Total de despesas do ano")
    saldo: float = Field(..., description="Saldo anual")
    quantidade_total: int = Field(..., description="Total de itens no ano")
    insights_receitas: list[InsightItem] = Field(
        ..., description="Top categorias de receitas (máx 6)"
    )
    insights_despesas: list[InsightItem] = Field(
        ..., description="Top categorias de despesas (máx 6)"
    )
    evolucao_mensal: list[ResumoMensalItem] = Field(
        ..., description="Evolução mês a mês"
    )
