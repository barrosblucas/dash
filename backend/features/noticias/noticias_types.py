"""
Noticias bounded context — types and schemas.

Schema para a última notícia do município exibida no
Painel de Informações Rápidas do portal.
"""

from __future__ import annotations

from pydantic import BaseModel


class NoticiaResponse(BaseModel):
    """Schema de resposta para a última notícia do município."""

    titulo: str
    chamada: str
    link: str
    data_publicacao: str
    fonte: str
