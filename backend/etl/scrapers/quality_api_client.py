"""
Cliente HTTP assíncrono para a API do portal QualitySistemas.

Encapsula toda a comunicação com os endpoints de receitas e despesas,
incluindo headers obrigatórios, retry com backoff exponencial e
tratamento de erros.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# --- Constantes de configuração ---
_BASE_RECEITAS_URL = "https://web.qualitysistemas.com.br/receitas"
# O portal de despesas exige rota com barra dupla ("/despesas//Endpoint").
_BASE_DESPESAS_URL = "https://web.qualitysistemas.com.br/despesas/"
_ENTITY_SLUG = "prefeitura_municipal_de_bandeirantes"
_ENTITY_ID = 255

_REQUEST_TIMEOUT = 30.0
_MAX_RETRIES = 3
_BACKOFF_BASE_SECONDS = 2.0

_HEADERS_RECEITAS = {
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": f"https://web.qualitysistemas.com.br/receitas/{_ENTITY_SLUG}",
    "Accept": "application/json, text/javascript, */*; q=0.01",
}

_HEADERS_DESPESAS = {
    **_HEADERS_RECEITAS,
    "Referer": (f"https://web.qualitysistemas.com.br/despesas/{_ENTITY_SLUG}"),
}


class QualityAPIClient:
    """Cliente assíncrono para o portal de transparência QualitySistemas.

    Fornece métodos para buscar receitas e despesas com retry automático
    e tratamento de erros. Cada método retorna o payload decodificado
    ou um resultado vazio em caso de falha.
    """

    def __init__(self) -> None:
        self._timeout = httpx.Timeout(_REQUEST_TIMEOUT)

    async def fetch_revenue_monthly(
        self, year: int, und_gestora: int = 0
    ) -> list[dict[str, Any]]:
        """Busca receitas mensais (valor arrecadado por mês).

        Args:
            year: Ano de referência.
            und_gestora: Código da unidade gestora (default 0).

        Returns:
            Lista de dicts com chaves ``mes`` e ``valorArrecadado``.
        """
        endpoint = "Revenue"
        params = {
            "entity": _ENTITY_SLUG,
            "entityType": "1",
            "year": str(year),
            "undGestora": str(und_gestora),
        }
        data = await self._get_json(
            _BASE_RECEITAS_URL, endpoint, params, _HEADERS_RECEITAS
        )
        if isinstance(data, list):
            return data
        logger.warning("Resposta inesperada de receitas mensais: %s", type(data))
        return []

    async def fetch_revenue_detailing(
        self, year: int, cod_und_gestora: int = 0
    ) -> list[dict[str, Any]]:
        """Busca detalhamento de receitas por rubrica.

        Args:
            year: Ano de referência.
            cod_und_gestora: Código da unidade gestora (default 0).

        Returns:
            Lista de dicts com detalhamento por rubrica e valores mensais.
        """
        endpoint = "DetailingRevenue"
        params = {
            "entity": _ENTITY_SLUG,
            "entityType": "1",
            "year": str(year),
            "codUndGestora": str(cod_und_gestora),
        }
        data = await self._get_json(
            _BASE_RECEITAS_URL, endpoint, params, _HEADERS_RECEITAS
        )
        if isinstance(data, list):
            return data
        logger.warning(
            "Resposta inesperada de detalhamento de receitas: %s", type(data)
        )
        return []

    async def fetch_despesas_annual(
        self, year: int, unidade_gestora: int = 0
    ) -> dict[str, Any]:
        """Busca despesas anuais (empenhado, liquidado, pago por mês).

        Args:
            year: Ano de referência.
            unidade_gestora: Código da unidade gestora (default 0).

        Returns:
            Dict com ``quantidadeRegistro``, ``total`` e registros mensais.
        """
        endpoint = "BuscaDadosAnual"
        params = {
            "entity": _ENTITY_SLUG,
            "unidadeGestora": str(unidade_gestora),
            "ano": str(year),
        }
        data = await self._get_json(
            _BASE_DESPESAS_URL, endpoint, params, _HEADERS_DESPESAS
        )
        if isinstance(data, dict):
            return data
        logger.warning("Resposta inesperada de despesas anuais: %s", type(data))
        return {}

    async def fetch_despesas_natureza(
        self, year: int, unidade_gestora: int = 0
    ) -> dict[str, Any]:
        """Busca despesas por natureza (valores mensais por categoria).

        Args:
            year: Ano de referência.
            unidade_gestora: Código da unidade gestora (default 0).

        Returns:
            Dict com ``quantidade``, ``total`` e registros por natureza.
        """
        endpoint = "NaturezaDespesa"
        params = {
            "entity": _ENTITY_SLUG,
            "unidadeGestora": str(unidade_gestora),
            "ano": str(year),
        }
        data = await self._get_json(
            _BASE_DESPESAS_URL, endpoint, params, _HEADERS_DESPESAS
        )
        if isinstance(data, dict):
            return data
        logger.warning("Resposta inesperada de despesas por natureza: %s", type(data))
        return {}

    async def _get_json(
        self,
        base_url: str,
        endpoint: str,
        params: dict[str, str],
        headers: dict[str, str],
    ) -> Any:
        """Executa GET com retry exponencial e retorna JSON decodificado.

        Args:
            base_url: URL base do endpoint.
            endpoint: Nome do endpoint (ex: ``Revenue``).
            params: Parâmetros query string.
            headers: Headers HTTP obrigatórios.

        Returns:
            Payload JSON decodificado ou ``None`` em caso de falha.
        """
        url = f"{base_url}/{endpoint}"
        last_exception: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(
                    timeout=self._timeout, headers=headers
                ) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    return response.json()

            except httpx.HTTPStatusError as exc:
                last_exception = exc
                logger.error(
                    "HTTP %s em %s (tentativa %d/%d)",
                    exc.response.status_code,
                    url,
                    attempt,
                    _MAX_RETRIES,
                )

            except httpx.RequestError as exc:
                last_exception = exc
                logger.error(
                    "Erro de requisição em %s (tentativa %d/%d): %s",
                    url,
                    attempt,
                    _MAX_RETRIES,
                    exc,
                )

            if attempt < _MAX_RETRIES:
                delay = _BACKOFF_BASE_SECONDS * (2 ** (attempt - 1))
                logger.info("Aguardando %.1fs antes de tentar novamente...", delay)
                await asyncio.sleep(delay)

        logger.error(
            "Falha definitiva após %d tentativas para %s: %s",
            _MAX_RETRIES,
            url,
            last_exception,
        )
        return None
