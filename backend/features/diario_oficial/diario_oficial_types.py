"""
Schemas Pydantic da feature Diário Oficial.

Define os contratos de entrada/saída para consulta do Diário Oficial de Bandeirantes MS.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DiarioEdicao(BaseModel):
    """Uma edição do Diário Oficial (regular ou suplementar)."""

    numero: str = Field(..., description="Número da edição (ex: '2908')")
    data: str = Field(..., description="Data da edição no formato dd-mm-aaaa")
    link_download: str = Field(..., description="URL de download do PDF")
    tamanho: str | None = Field(
        default=None, description="Tamanho do arquivo (ex: '322.65 KB')"
    )
    suplementar: bool = Field(
        default=False, description="True se for edição suplementar"
    )


class DiarioResponse(BaseModel):
    """Resposta da consulta do Diário Oficial para uma data."""

    data_consulta: str = Field(..., description="Data consultada no formato dd/mm/aaaa")
    tem_edicao: bool = Field(
        ..., description="True se há pelo menos uma edição publicada na data"
    )
    edicoes: list[DiarioEdicao] = Field(
        default_factory=list, description="Lista de edições encontradas"
    )
    mensagem: str | None = Field(
        default=None,
        description="Mensagem informativa quando não há edição ou ocorre erro",
    )


class DiarioBuscaItem(BaseModel):
    """Item de resultado da busca no Diário Oficial."""

    id: str
    titulo: str
    data_publicacao: str  # DD/MM/YYYY
    numero_materia: str
    numero_lei: str = ""  # Extraído do título se for lei
    ano_lei: str = ""
    link_download: str = ""  # URL direta do PDF (preenchido após resolução)


class DiarioBuscaResponse(BaseModel):
    """Resposta paginada da busca."""

    items: list[DiarioBuscaItem]
    total: int
    page: int
    size: int


class DiarioImportRequest(BaseModel):
    """Requisição para importar uma publicação como legislação."""

    diario_id: str = Field(..., description="ID da publicação no Diário Oficial")
    titulo: str = Field(..., description="Título da publicação")
    data_publicacao: str = Field(..., description="Data no formato DD/MM/YYYY")
    numero_materia: str = Field(..., description="Número da matéria/edição")
    link_download: str = Field(..., description="URL direta do PDF para download")
    numero_lei: str = Field(..., min_length=1, description="Número da lei extraído")
    ano_lei: str = Field(..., description="Ano da lei")
    tipo: str = Field(default="LEI", description="Tipo de legislação")
    url_arquivo: str = Field(
        default="",
        description="URL da legislação individual (/baixar-materia/{id}/{hash}) para armazenamento",
    )
