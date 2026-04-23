"""ACL para os endpoints públicos do E-Saúde."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.shared.settings import get_settings

logger = logging.getLogger(__name__)

_DEFAULT_HEADERS = {
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0",
}


class SaudeExternalAPIError(Exception):
    """Erro ao comunicar com o E-Saúde."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ESaudeClient:
    """Cliente HTTP mínimo para o portal Saúde Transparente."""

    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.saude_esaude_base_url.rstrip("/")
        self._timeout = httpx.Timeout(settings.saude_esaude_timeout_seconds)

    async def fetch_quantitativos(self) -> dict[str, Any]:
        payload = await self._get_json("/buscar-dados-quantitativos")
        if not isinstance(payload, dict):
            raise SaudeExternalAPIError(
                "Payload inválido em buscar-dados-quantitativos"
            )
        return payload

    async def fetch_medicamentos_tabela(
        self, search: str | None = None
    ) -> dict[str, Any]:
        params = {"search": search} if search else None
        payload = await self._get_json("/medicamentos-tabela", params=params)
        if not isinstance(payload, dict):
            raise SaudeExternalAPIError("Payload inválido em medicamentos-tabela")
        return payload

    async def fetch_localizacao_unidades(self) -> list[dict[str, Any]]:
        payload = await self._get_json("/consultar-servicos-de-saude/localizacao")
        if not isinstance(payload, list):
            raise SaudeExternalAPIError(
                "Payload inválido em consultar-servicos-de-saude/localizacao"
            )
        return [item for item in payload if isinstance(item, dict)]

    async def fetch_unidade_horarios(self, unidade_id: int) -> dict[str, Any]:
        payload = await self._get_json(f"/unidades/{unidade_id}/horarios")
        if not isinstance(payload, dict):
            raise SaudeExternalAPIError("Payload inválido em unidades/{id}/horarios")
        return payload

    async def fetch_chart(
        self, resource: str, year: int | None = None
    ) -> dict[str, Any]:
        params = {"ano": str(year)} if year is not None else None
        payload = await self._get_json(
            f"/buscar-dados-do-chart/{resource}", params=params
        )
        if not isinstance(payload, dict):
            raise SaudeExternalAPIError(f"Payload inválido no chart {resource}")
        return payload

    async def _get_json(
        self,
        path: str,
        params: dict[str, str] | None = None,
    ) -> Any:
        url = f"{self._base_url}{path}"
        try:
            async with httpx.AsyncClient(
                timeout=self._timeout, headers=_DEFAULT_HEADERS
            ) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Erro HTTP no E-Saúde (%s): %s", exc.response.status_code, url
            )
            raise SaudeExternalAPIError(
                f"Erro ao buscar dados do E-Saúde: HTTP {exc.response.status_code}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.RequestError as exc:
            logger.warning("Erro de conexão no E-Saúde (%s): %s", url, exc)
            raise SaudeExternalAPIError("Erro de conexão com o E-Saúde") from exc
