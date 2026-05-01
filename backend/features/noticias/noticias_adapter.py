"""
Adaptador para fonte de notícias do município (ACL).

Busca a última notícia do site oficial da Prefeitura de Bandeirantes
via RSS feed do WordPress.

Padrão ACL (Anti-Corruption Layer) — isola a fonte externa
do resto da aplicação.
"""

from __future__ import annotations

import logging
import re
import xml.etree.ElementTree as ET
from datetime import date, datetime

import httpx

from backend.features.noticias.noticias_types import NoticiaResponse

logger = logging.getLogger(__name__)

# RSS feed da categoria Destaques do site oficial
_RSS_URL = "https://bandeirantes.ms.gov.br/v2/category/destaques/feed/"
_REQUEST_TIMEOUT = 15.0

# Dados mockados de fallback caso o RSS esteja indisponível
_FALLBACK_NOTICIAS: list[dict[str, str]] = [
    {
        "titulo": "Prefeitura entrega reforma da Praça Central",
        "chamada": (
            "A Prefeitura de Bandeirantes concluiu a revitalização da Praça"
            " Central com novos equipamentos de lazer, acessibilidade e"
            " paisagismo. A obra beneficia diretamente mais de 10 mil munícipes."
        ),
        "link": "https://www.bandeirantes.ms.gov.br/noticias/reforma-praca-central",
        "data_publicacao": "2026-04-28",
        "fonte": "prefeitura",
    },
]


def _strip_html(text: str) -> str:
    """Remove tags HTML e encurta espaços."""
    cleaned = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def _parse_pubdate(pub_date_str: str) -> str:
    """Converte data RSS (RFC 2822) para ISO (YYYY-MM-DD)."""
    try:
        # Ex: "Thu, 30 Apr 2026 19:07:48 +0000"
        dt = datetime.strptime(pub_date_str[:-6], "%a, %d %b %Y %H:%M:%S")
        return dt.strftime("%Y-%m-%d")
    except (ValueError, IndexError):
        return date.today().isoformat()


async def fetch_ultima_noticia() -> NoticiaResponse:
    """Retorna a notícia mais recente do município.

    Busca o RSS feed da categoria Destaques no site oficial.
    Se o feed estiver indisponível, retorna fallback mockado.

    Returns:
        NoticiaResponse com a notícia mais recente.
    """
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(_RSS_URL)
            response.raise_for_status()
            xml_text = response.text
    except Exception as exc:
        logger.warning("RSS feed indisponível (%s: %s) — usando fallback", type(exc).__name__, exc)
        return _build_fallback()

    try:
        root = ET.fromstring(xml_text)
        # RSS namespace: channel > item
        channel = root.find("channel")
        if channel is None:
            logger.warning("RSS sem <channel> — usando fallback")
            return _build_fallback()

        first_item = channel.find("item")
        if first_item is None:
            logger.warning("RSS sem <item> — usando fallback")
            return _build_fallback()

        def _find_text(tag: str) -> str:
            el = first_item.find(tag)
            return el.text.strip() if el is not None and el.text else ""

        titulo = _find_text("title")
        link = _find_text("link")
        raw_desc = _find_text("description")
        chamada = _strip_html(raw_desc)[:200]  # limite de 200 chars
        pub_date = _find_text("pubDate")
        data_publicacao = _parse_pubdate(pub_date)

        if not titulo:
            logger.warning("RSS com título vazio — usando fallback")
            return _build_fallback()

        return NoticiaResponse(
            titulo=titulo,
            chamada=chamada or titulo,
            link=link,
            data_publicacao=data_publicacao,
            fonte="prefeitura",
        )

    except ET.ParseError as exc:
        logger.warning("Erro ao parsear RSS (%s) — usando fallback", exc)
        return _build_fallback()


def _build_fallback() -> NoticiaResponse:
    """Retorna notícia mockada de fallback."""
    noticia = _FALLBACK_NOTICIAS[0]
    return NoticiaResponse(
        titulo=noticia["titulo"],
        chamada=noticia["chamada"],
        link=noticia["link"],
        data_publicacao=noticia["data_publicacao"],
        fonte=noticia["fonte"],
    )
