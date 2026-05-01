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

    data_consulta: str = Field(
        ..., description="Data consultada no formato dd/mm/aaaa"
    )
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
