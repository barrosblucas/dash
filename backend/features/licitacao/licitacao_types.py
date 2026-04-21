"""
Licitacao bounded context — types and schemas.

Consolidates:
  - api/schemas_licitacao.py (Pydantic schemas)
"""

from __future__ import annotations

from pydantic import BaseModel


class LicitacaoComprasBRItem(BaseModel):
    """Item de licitação retornado pela API ComprasBR."""

    id: int
    numeroEdital: str
    objeto: str
    status: str
    modalidade: str
    orgaoNome: str
    dataAbertura: str
    urlProcesso: str = ""


class LicitacaoComprasBRResponse(BaseModel):
    """Resposta paginada da API ComprasBR."""

    items: list[LicitacaoComprasBRItem]
    totalPages: int
    totalElements: int
    page: int
    size: int


class LicitacaoComprasBRDocumento(BaseModel):
    """Documento anexado a uma licitação ComprasBR."""

    id: int
    tipo: str
    arquivoNome: str
    arquivoUri: str


class LicitacaoComprasBRDetailItem(BaseModel):
    """Item detalhado de licitação retornado pela API ComprasBR."""

    id: int
    numeroEdital: str
    numProcesso: str
    objeto: str
    status: str
    modalidade: str
    fase: str
    orgaoNome: str
    dataAbertura: str
    dataIniEnvioProposta: str | None = None
    dataFimEnvioProposta: str | None = None
    tipoDisputa: str = ""
    modoDisputa: str = ""
    pregoeiro: str = ""
    legislacao: str = ""
    urlProcesso: str = ""
    documentos: list[LicitacaoComprasBRDocumento] = []


class DispensaLicitaçãoItem(BaseModel):
    """Item de dispensa de licitação extraído do portal Quality."""

    codigo: str
    processo: str
    disputa: str
    criterio: str
    tipo: str
    dataAbertura: str
    dataJulgamento: str
    status: str
    objeto: str
    urlProcesso: str = ""
    modalidade: str = ""


class DispensasLicitacaoResponse(BaseModel):
    """Resposta com lista de dispensas de licitação."""

    items: list[DispensaLicitaçãoItem]
    quantidade: int
