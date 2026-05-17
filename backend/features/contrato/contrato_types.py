"""Contrato bounded context — types and schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ContratoFiscal(BaseModel):
    """Fiscal do contrato."""

    nome: str = Field(..., description="Nome do fiscal")
    tipo: str = Field(..., description="Tipo do fiscal")
    data_inicio: str = Field(..., description="Data de início da fiscalização")
    data_fim: str = Field(..., description="Data de fim da fiscalização")


class ContratoItem(BaseModel):
    """Item de contrato (listagem)."""

    numero: str = Field(..., description="Número do contrato (ex: 0000053/2026)")
    fornecedor: str = Field(..., description="Nome do fornecedor/contratado")
    cpf_cnpj: str = Field(..., description="CPF ou CNPJ do fornecedor")
    tipo: str = Field(
        ...,
        description=(
            "Tipo do contrato: CONTRATO PRINCIPAL,"
            " ADITIVO POR VALOR(ACRÉSCIMO), etc."
        ),
    )
    vigencia: str = Field(
        ..., description="Vigência (ex: 14/05/2026 a 14/05/2027 ou -)"
    )
    valor: float = Field(..., description="Valor do contrato")
    ano: int = Field(..., description="Ano de referência")


class ContratoDetalhe(BaseModel):
    """Detalhamento completo de um contrato."""

    numero: str = Field(..., description="Número do contrato")
    fornecedor: str = Field(..., description="Nome do fornecedor/contratado")
    cpf_cnpj: str = Field(..., description="CPF ou CNPJ do fornecedor")
    tipo: str = Field(..., description="Tipo do contrato")
    vigencia: str = Field(..., description="Vigência do contrato")
    valor: float = Field(..., description="Valor do contrato")
    objeto: str = Field(..., description="Objeto do contrato")
    processo_numero: str = Field(..., description="Número do processo")
    licitacao: str = Field(..., description="Modalidade de licitação")
    assunto: str = Field(..., description="Assunto do contrato")
    qtd_aditivos: int = Field(..., description="Quantidade de aditivos")
    valor_contratado: float = Field(..., description="Valor contratado original")
    valor_atualizado: float = Field(..., description="Valor atualizado do contrato")
    saldo_pagar: float = Field(..., description="Saldo a pagar")
    valor_anulado: float = Field(..., description="Valor anulado")
    dotacoes_orcamentarias: str = Field(
        ..., description="Dotações orçamentárias"
    )
    fiscais: list[ContratoFiscal] = Field(
        default_factory=list, description="Fiscais do contrato"
    )
    ano: int = Field(..., description="Ano de referência")


class ContratoResumoAnual(BaseModel):
    """Resumo anual de contratos."""

    ano: int = Field(..., description="Ano de referência")
    quantidade_contratos: int = Field(..., description="Quantidade total de contratos")
    total_valor: float = Field(..., description="Valor total dos contratos")
    quantidade_principais: int = Field(
        ..., description="Quantidade de contratos principais"
    )
    quantidade_aditivos: int = Field(..., description="Quantidade de aditivos")


class ContratoListResponse(BaseModel):
    """Resposta da listagem de contratos."""

    items: list[ContratoItem] = Field(..., description="Lista de contratos")
    quantidade: int = Field(..., description="Total de contratos retornados")
    resumo: ContratoResumoAnual = Field(
        ..., description="Resumo anual dos contratos"
    )
