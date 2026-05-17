"""
Adaptador para API externa de Emendas Parlamentares (Quality).

Encapsula chamadas HTTP para o portal de emendas Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.emenda.emenda_types import EmendaItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/emenda_parlamentar/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaEmendaPorAno"
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
    params: dict[str, str] = {"ano": str(ano)}
    if tipo is not None:
        params["tipo"] = tipo

    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar emendas (ano=%s tipo=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    tipo,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar emendas (ano=%s tipo=%s)",
                    ano,
                    tipo,
                )
                return []

            response.raise_for_status()
            data = response.json()
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

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[EmendaItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            emenda_item = _parse_emenda_item(item, ano)
            if emenda_item is not None:
                items.append(emenda_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de emenda: %s — item=%s",
                exc,
                item.get("emenda", "?"),
            )

    return items


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
        valor = float(valor_raw) if valor_raw not in ("", "-") else 0.0
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
