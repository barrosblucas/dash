"""
Rotas HTTP do bounded context notícias.

Apenas orquestração — delega para o adapter.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from backend.features.noticias.noticias_adapter import fetch_ultima_noticia
from backend.features.noticias.noticias_types import NoticiaResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/noticias", tags=["noticias"])


@router.get(
    "/ultima",
    response_model=NoticiaResponse,
    summary="Última notícia do município",
)
async def get_ultima_noticia() -> NoticiaResponse:
    """Retorna a notícia mais recente do município.

    Útil para o Painel de Informações Rápidas do portal público.
    Atualmente utiliza dados mockados — a fonte real será
    integrada futuramente via adapter.
    """
    return await fetch_ultima_noticia()
