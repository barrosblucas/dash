"""
Adaptador para API externa de Emendas Parlamentares (Quality).

Encapsula chamadas HTTP para o portal de emendas Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging
import re
from html import unescape

import httpx

from backend.features.emenda.emenda_types import EmendaItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://portalquality.qualitysistemas.com.br"
    "/emenda_parlamentar/prefeitura_municipal_de_bandeirantes"
)
_REQUEST_TIMEOUT = 30.0

_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": _BASE_URL,
    "Accept": "application/json, text/javascript, */*; q=0.01",
}


class EmendaAPIError(Exception):
    """Erro ao comunicar com API externa de emendas parlamentares."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_emendas(ano: int, tipo: str | None = None) -> list[EmendaItem]:
    """Busca emendas do portal Quality para um ano.

    Args:
        ano: Ano de referência.
        tipo: Filtrar por tipo de emenda (ex: "Emenda Individual - Transferências
              com Finalidade Definida", None para todos).

    Returns:
        Lista de EmendaItem. Retorna lista vazia em caso de HTTP 404, 5xx,
        ou erro de conexão — nunca lança exceção.
    """
    params: dict[str, str] = {"exercicio": str(ano)}
    if tipo is not None:
        params["idTipoEmenda"] = tipo

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            dedup: dict[tuple[str, str, str], EmendaItem] = {}
            for mes in range(1, 13):
                response = await client.get(
                    _BASE_URL,
                    params={**params, "mes": f"{mes:02d}"},
                    headers=_HEADERS,
                )

                if response.status_code >= 500:
                    logger.warning(
                        "API externa indisponível (HTTP %d) ao buscar emendas (ano=%s tipo=%s mes=%s) — retornando vazio",
                        response.status_code,
                        ano,
                        tipo,
                        mes,
                    )
                    return []

                if response.status_code == 404:
                    continue

                response.raise_for_status()
                for item in _parse_emendas_html(response.text, ano):
                    collision_key = (item.emenda, item.numero_protocolo)
                    same_item_key = (item.emenda, item.numero_protocolo, item.detalhes_link)
                    if same_item_key in dedup:
                        continue
                    if any(k[:2] == collision_key for k in dedup):
                        detail_suffix = item.detalhes_link.rstrip("/").split("/")[-1].split("?")[0]
                        item = item.model_copy(
                            update={
                                "numero_protocolo": f"{item.numero_protocolo}#{detail_suffix}",
                            }
                        )
                    dedup[(item.emenda, item.numero_protocolo, item.detalhes_link)] = item

            return list(dedup.values())
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar emendas (ano=%s tipo=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            tipo,
        )
        return []
    except httpx.RequestError as exc:
        logger.warning(
            "Erro de conexão ao buscar emendas (ano=%s tipo=%s): %s — retornando vazio",
            ano,
            tipo,
            exc,
        )
        return []

    return []


def _parse_emenda_item(item: dict, ano: int) -> EmendaItem | None:
    """Converte um item do JSON da API para EmendaItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.

    Returns:
        EmendaItem ou None se inválido.
    """
    emenda = item.get("emenda") or item.get("Emenda") or item.get("EMENDA") or ""
    if not emenda:
        return None

    tipo_emenda = (
        item.get("tipo_emenda")
        or item.get("tipoEmenda")
        or item.get("Tipo da Emenda")
        or item.get("Tipo")
        or ""
    )
    numero_protocolo = (
        item.get("numero_protocolo")
        or item.get("numeroProtocolo")
        or item.get("Nr. Protocolo")
        or item.get("protocolo")
        or ""
    )
    descricao = (
        item.get("descricao") or item.get("Descricao") or item.get("Descrição") or ""
    )
    detalhes_link = (
        item.get("detalhes_link")
        or item.get("detalhesLink")
        or item.get("Detalhes link")
        or item.get("link")
        or ""
    )

    valor_raw = item.get("valor") or item.get("Valor") or "0"
    try:
        valor = _parse_money(valor_raw)
    except (ValueError, TypeError):
        valor = 0.0

    return EmendaItem(
        emenda=str(emenda).strip(),
        tipo_emenda=str(tipo_emenda).strip(),
        numero_protocolo=str(numero_protocolo).strip(),
        descricao=str(descricao).strip(),
        valor=valor,
        detalhes_link=str(detalhes_link).strip(),
        ano=ano,
    )


def _parse_emendas_html(html: str, ano: int) -> list[EmendaItem]:
    table_match = re.search(r"<tbody>(.*?)</tbody>", html, flags=re.S | re.I)
    if table_match is None:
        return []

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_match.group(1), flags=re.S | re.I)
    items: list[EmendaItem] = []

    for row_html in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row_html, flags=re.S | re.I)
        if len(cells) < 6:
            continue

        emenda = _strip_html(cells[0])
        if not emenda or emenda.lower().startswith("valor total"):
            continue

        detalhes_match = re.search(r'href="([^"]+)"', cells[5], flags=re.I)
        parsed = _parse_emenda_item(
            {
                "emenda": emenda,
                "tipo_emenda": _strip_html(cells[1]),
                "numero_protocolo": _strip_html(cells[2]),
                "descricao": _strip_html(cells[3]),
                "valor": _strip_html(cells[4]),
                "detalhes_link": detalhes_match.group(1) if detalhes_match else "",
            },
            ano,
        )
        if parsed is not None:
            items.append(parsed)

    return items


def _strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _parse_money(value: object) -> float:
    raw = str(value or "").strip()
    if raw in ("", "-"):
        return 0.0
    return float(raw.replace(".", "").replace(",", "."))
