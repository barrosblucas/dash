"""
Adaptador (ACL) para o site diariooficialms.com.br.

Faz a requisição HTTP e parseia o HTML para extrair edições do Diário Oficial.
"""

from __future__ import annotations

import logging
import re
from datetime import date
from typing import Any

import httpx
from selectolax.lexbor import LexborHTMLParser

from backend.features.diario_oficial.diario_oficial_types import DiarioEdicao

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.diariooficialms.com.br/bandeirantes"
_REQUEST_TIMEOUT = 30.0
# Pattern para extrair "numero - data" do título do h4
_TITULO_PATTERN = re.compile(r"(\d+)\s*[-–]\s*(\d{2}-\d{2}-\d{4})")
# Pattern para extrair tamanho do arquivo
_TAMANHO_PATTERN = re.compile(r"([\d,.]+)\s*(KB|MB|GB)", re.IGNORECASE)
# Palavras que indicam edição suplementar no título
_SUPLEMENTAR_TERMS = (
    "suplementar",
    "suplemento",
    "extra",
    "especial",
)


async def fetch_diario(data_consulta: date) -> list[DiarioEdicao]:
    """Busca edições do Diário Oficial para uma data específica.

    Faz uma requisição HTTP GET ao site diariooficialms.com.br
    e parseia o HTML retornado para extrair as edições.

    Args:
        data_consulta: Data para consultar o diário.

    Returns:
        Lista de edições encontradas (vazia se não houver).

    Raises:
        httpx.HTTPError: Se a requisição HTTP falhar.
    """
    data_str = data_consulta.strftime("%d/%m/%Y")
    url = f"{_BASE_URL}?data={data_str}"

    logger.info("Consultando Diário Oficial: %s", url)

    async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
        response = await client.get(
            url,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        response.raise_for_status()
        html = response.text

    return _parse_html(html)


def _parse_html(html: str) -> list[DiarioEdicao]:
    """Parseia o HTML retornado pelo site para extrair edições.

    O HTML contém um <ul class="list-group"> com <li> para cada edição.
    Cada <li> contém um link para o PDF e metadados no título h4.

    Args:
        html: Conteúdo HTML retornado pelo site.

    Returns:
        Lista de DiarioEdicao parseadas.
    """
    parser = LexborHTMLParser(html)
    edicoes: list[DiarioEdicao] = []

    for li in parser.css("ul.list-group li.list-group-item"):
        a_tag = li.css_first("a.sem-decoracao")
        if a_tag is None:
            continue

        link = a_tag.attributes.get("href", "")
        if not link:
            continue

        h4 = a_tag.css_first("h4.texto-cinza")
        if h4 is None:
            continue

        # Extrai o texto do h4, removendo ícones e spans internos
        # O texto contém: "NUMERO - DATA [TAMANHO]"
        full_text = _extract_text(h4)

        # Parse número e data do título
        titulo_match = _TITULO_PATTERN.search(full_text)
        if titulo_match is None:
            logger.warning("Não foi possível parsear título do diário: %s", full_text)
            continue

        numero = titulo_match.group(1)
        data_edicao = titulo_match.group(2)

        # Extrai tamanho do arquivo
        tamanho_match = _TAMANHO_PATTERN.search(full_text)
        tamanho = (
            f"{tamanho_match.group(1)} {tamanho_match.group(2).upper()}"
            if tamanho_match
            else None
        )

        # Detecta se é suplementar pelo texto do título
        texto_lower = full_text.lower()
        suplementar = any(term in texto_lower for term in _SUPLEMENTAR_TERMS)

        edicoes.append(
            DiarioEdicao(
                numero=numero,
                data=data_edicao,
                link_download=link,
                tamanho=tamanho,
                suplementar=suplementar,
            )
        )

    return edicoes


def _extract_text(node: Any) -> str:
    """Extrai texto limpo de um nó HTML, removendo ícones.

    Remove todos os ícones FontAwesome (elementos <i>) antes de
    extrair o texto, preservando apenas o texto visível do título.

    Args:
        node: Nó selectolax (h4).

    Returns:
        Texto limpo do título.
    """
    # Remove todos os ícones (i) antes de extrair texto
    for icon in node.css("i"):
        icon.decompose()

    return str(node.text(separator=" ", strip=True))
