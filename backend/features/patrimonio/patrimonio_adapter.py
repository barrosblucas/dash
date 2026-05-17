"""
Adaptador para API externa de Controle Patrimonial (Quality).

Encapsula chamadas HTTP para o portal de levantamento patrimonial Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.patrimonio.patrimonio_types import PatrimonioItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://web.qualitysistemas.com.br"
    "/levantamento_patrimonial/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaPatrimonioPorAno"
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


class PatrimonioAPIError(Exception):
    """Erro ao comunicar com API externa de patrimônio."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_patrimonio(
    ano: int,
    tipo_bem: str | None = None,
) -> list[PatrimonioItem]:
    """Busca dados patrimoniais do portal Quality para um ano.

    Args:
        ano: Ano de referência.
        tipo_bem: Filtrar por tipo ("Móvel", "Imóvel", "Veículo") ou None para todos.

    Returns:
        Lista de PatrimonioItem.

    Raises:
        PatrimonioAPIError: Em caso de falha na comunicação.
    """
    params: dict[str, str] = {"ano": str(ano)}
    if tipo_bem is not None:
        params["tipo_bem"] = tipo_bem

    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=_HEADERS)

            if response.status_code >= 500:
                logger.warning(
                    "API externa indisponível (HTTP %d) ao buscar patrimônio (ano=%s tipo_bem=%s) — retornando vazio",
                    response.status_code,
                    ano,
                    tipo_bem,
                )
                return []

            if response.status_code == 404:
                logger.info(
                    "Nenhum dado encontrado (HTTP 404) ao buscar patrimônio (ano=%s tipo_bem=%s)",
                    ano,
                    tipo_bem,
                )
                return []

            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "HTTP %s ao buscar patrimônio (ano=%s tipo_bem=%s) — retornando vazio",
            exc.response.status_code,
            ano,
            tipo_bem,
        )
        return []
    except httpx.ConnectError:
        logger.warning(
            "API externa indisponível ao buscar patrimônio (ano=%s tipo_bem=%s) — retornando vazio",
            ano,
            tipo_bem,
        )
        return []
    except Exception as exc:
        logger.warning(
            "Erro inesperado ao buscar patrimônio (ano=%s tipo_bem=%s): %s — retornando vazio",
            ano,
            tipo_bem,
            exc,
        )
        return []

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[PatrimonioItem] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        try:
            patrimonio_item = _parse_patrimonio_item(item, ano)
            if patrimonio_item is not None:
                items.append(patrimonio_item)
        except Exception as exc:
            logger.warning(
                "Falha ao converter item de patrimônio: %s — item=%s",
                exc,
                item.get("descricao", "?"),
            )

    return items


def _parse_patrimonio_item(item: dict, ano: int) -> PatrimonioItem | None:
    """Converte um item do JSON da API para PatrimonioItem.

    Args:
        item: Dict do JSON da API.
        ano: Ano de referência.

    Returns:
        PatrimonioItem ou None se inválido.
    """
    tipo_bem = item.get("tipo_bem") or item.get("Tipo Bem") or ""
    descricao = item.get("descricao") or item.get("Descrição") or item.get("Descricao") or ""
    if not descricao:
        return None

    def _parse_float(raw: object) -> float:
        if isinstance(raw, int | float):
            return float(raw)
        if isinstance(raw, str) and raw not in ("", "-"):
            try:
                return float(raw)
            except (ValueError, TypeError):
                pass
        return 0.0

    def _parse_int(raw: object) -> int:
        if isinstance(raw, int):
            return raw
        if isinstance(raw, str) and raw not in ("", "-"):
            try:
                return int(raw)
            except (ValueError, TypeError):
                pass
        return 0

    return PatrimonioItem(
        tipo_bem=str(tipo_bem).strip(),
        descricao=str(descricao).strip(),
        quantidade_anterior=_parse_int(
            item.get("quantidade_anterior") or item.get("Qtde Anterior") or 0
        ),
        valor_anterior=_parse_float(
            item.get("valor_anterior") or item.get("Valor Anterior") or 0
        ),
        quantidade_adquiridos=_parse_int(
            item.get("quantidade_adquiridos") or item.get("Qtde Adquiridos") or 0
        ),
        valor_adquiridos=_parse_float(
            item.get("valor_adquiridos") or item.get("Valor Adquiridos") or 0
        ),
        quantidade_baixados=_parse_int(
            item.get("quantidade_baixados") or item.get("Qtde Baixados") or 0
        ),
        valor_baixados=_parse_float(
            item.get("valor_baixados") or item.get("Valor Baixados") or 0
        ),
        quantidade_atual=_parse_int(
            item.get("quantidade_atual") or item.get("Qtde Atual") or item.get("Saldo Total") or 0
        ),
        valor_atual=_parse_float(
            item.get("valor_atual") or item.get("Valor Atual") or item.get("Valor Total") or 0
        ),
        ano=ano,
    )
