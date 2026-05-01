"""
Adaptador para API externa de Movimento Extra Orçamentário (Quality).

Encapsula chamadas HTTP para o portal Quality.
Não contém lógica de negócio — apenas busca e mapeamento de dados.
"""

from __future__ import annotations

import logging

import httpx

from backend.features.movimento_extra.movimento_extra_types import MovimentoExtraItem

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://portalquality.qualitysistemas.com.br"
    "/movimento_extra_orcamentario/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaMovimentoPorAno"
_REQUEST_TIMEOUT = 30.0


class MovimentoExtraAPIError(Exception):
    """Erro ao comunicar com API externa de movimento extra."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_tipo(
    ano: int, mes: int, tipo: str
) -> list[MovimentoExtraItem]:
    """Busca itens de um tipo (R ou D) na API externa."""
    params: dict[str, str] = {"ano": str(ano), "mes": str(mes), "tipo": tipo}
    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar movimento extra (ano=%s mes=%s tipo=%s)",
            exc.response.status_code,
            ano,
            mes,
            tipo,
        )
        raise MovimentoExtraAPIError(
            f"Erro ao buscar dados na API externa: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar movimento extra: %s", exc)
        raise MovimentoExtraAPIError("Erro de conexão com a API externa") from exc

    if not isinstance(data, list):
        logger.warning("Resposta inesperada da API externa: %s", type(data))
        return []

    items: list[MovimentoExtraItem] = []
    for item in data:
        # External API returns placeholder items with null fields when no data exists
        if not isinstance(item, dict):
            continue
        if item.get("codigo") is None:
            continue
        if item.get("tipo") not in ("R", "D"):
            continue
        try:
            item["ano"] = ano
            items.append(MovimentoExtraItem(**item))
        except Exception as exc:
            logger.warning(
                "Falha ao converter item do movimento extra: %s — item=%s",
                exc,
                {k: item.get(k) for k in ("codigo", "ent_codigo", "tipo", "mes")},
            )

    return items
