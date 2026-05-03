"""
Schemas Pydantic da feature Legislação Municipal.

Define os contratos de entrada/saída para busca e importação
de matérias legislativas individuais do diariooficialms.com.br.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LegislacaoBuscaItem(BaseModel):
    """Item de resultado da busca de legislação municipal."""

    id: str
    titulo: str
    data_publicacao: str  # DD/MM/YYYY
    numero_materia: str
    numero_lei: str = ""
    ano_lei: str = ""
    link_legislacao: str = ""  # URL /baixar-materia/{id}/{hash}
    link_diario_oficial: str = ""  # URL direta do DigitalOcean Spaces
    anexo_habilitado: bool = False


class LegislacaoBuscaResponse(BaseModel):
    """Resposta paginada da busca de legislação municipal."""

    items: list[LegislacaoBuscaItem]
    total: int
    page: int
    size: int


class LegislacaoDownloadRequest(BaseModel):
    """Requisição para baixar uma matéria legislativa individual."""

    id: str = Field(..., description="ID da matéria no Diário Oficial")
    link_legislacao: str = Field(
        ..., description="URL /baixar-materia/{id}/{hash} para download via reCAPTCHA"
    )


class LegislacaoImportRequest(BaseModel):
    """Requisição para importar uma matéria legislativa como legislação."""

    legislacao_id: str = Field(..., description="ID da matéria no Diário Oficial")
    titulo: str = Field(..., description="Título da matéria")
    data_publicacao: str = Field(..., description="Data no formato DD/MM/YYYY")
    numero_materia: str = Field(..., description="Número da matéria/edição")
    link_legislacao: str = Field(..., description="URL /baixar-materia/{id}/{hash}")
    link_diario_oficial: str = Field(
        ..., description="URL direta do PDF no DigitalOcean Spaces"
    )
    numero_lei: str = Field(..., min_length=1, description="Número da lei extraído")
    ano_lei: str = Field(..., description="Ano da lei")
    tipo: str = Field(default="LEI", description="Tipo de legislação")
