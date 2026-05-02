"""
Cliente HTTP assíncrono para busca e download no Diário Oficial MS.
"""

from __future__ import annotations

import asyncio
import logging
import re
from pathlib import Path
from typing import Any

import httpx

from backend.scripts.scrape_diario_oficial_models import (
    BASE_URL,
    CIDADE_ID,
    FILTRO_URL,
    HEADERS,
    PAGE_SIZE,
    REQUEST_DELAY,
)
from backend.scripts.scrape_diario_oficial_parsers import extract_direct_pdf_links

logger = logging.getLogger(__name__)


class DiarioOficialClient:
    """Cliente HTTP assíncrono para a API do Diário Oficial MS."""

    def __init__(self, timeout: float = 30.0) -> None:
        self._client: httpx.AsyncClient | None = None
        self._timeout = timeout

    async def __aenter__(self) -> DiarioOficialClient:
        self._client = httpx.AsyncClient(
            timeout=self._timeout,
            headers=HEADERS,
            follow_redirects=True,
        )
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._client:
            await self._client.aclose()

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError(
                "Client not initialized. Use 'async with' context manager."
            )
        return self._client

    async def search(
        self,
        term: str,
        data_inicio: str,
        data_fim: str,
        start: int = 0,
        length: int = PAGE_SIZE,
        order_column: int = 1,
        order_dir: str = "desc",
    ) -> dict[str, Any]:
        """Busca publicações no Diário Oficial via API DataTables.

        Args:
            term: Termo de busca no título (ex: "LEI").
            data_inicio: Data inicial (DD/MM/YYYY).
            data_fim: Data final (DD/MM/YYYY).
            start: Offset de paginação.
            length: Tamanho da página.
            order_column: Coluna de ordenação (1 = data_de_circulacao).
            order_dir: Direção da ordenação (asc/desc).

        Returns:
            Resposta JSON: draw, recordsTotal, recordsFiltered, data[].
        """
        params = {
            "draw": "1",
            "columns[0][data]": "titulo",
            "columns[1][data]": "data_de_circulacao",
            "columns[2][data]": "action-baixar",
            "columns[2][orderable]": "false",
            "order[0][column]": str(order_column),
            "order[0][dir]": order_dir,
            "start": str(start),
            "length": str(length),
            "search[value]": "",
            "filtro[municipio_id]": CIDADE_ID,
            "filtro[titulo]": term,
            "filtro[palavra_chave]": "",
            "filtro[data_de_inicio]": data_inicio,
            "filtro[data_de_fim]": data_fim,
        }

        response = await self.client.get(FILTRO_URL, params=params)
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def fetch_all_pages(
        self,
        term: str,
        data_inicio: str,
        data_fim: str,
        max_results: int | None = None,
    ) -> list[dict[str, Any]]:
        """Busca todas as páginas de resultados para um termo e período.

        Args:
            term: Termo de busca.
            data_inicio: Data inicial.
            data_fim: Data final.
            max_results: Limite máximo de resultados (None = sem limite).

        Returns:
            Lista de items (dict) de todas as páginas.
        """
        all_items: list[dict[str, Any]] = []
        start = 0

        while True:
            result = await self.search(
                term=term,
                data_inicio=data_inicio,
                data_fim=data_fim,
                start=start,
                length=PAGE_SIZE,
            )

            data = result.get("data", [])
            if not data:
                break

            all_items.extend(data)
            logger.info(
                "  Página start=%d: %d items (total filtrado: %d)",
                start,
                len(data),
                result.get("recordsFiltered", 0),
            )

            start += len(data)

            if max_results and len(all_items) >= max_results:
                break

            if start >= result.get("recordsFiltered", 0):
                break

            await asyncio.sleep(REQUEST_DELAY)

        return all_items

    async def fetch_pdf_links_for_date(self, data_str: str) -> dict[str, str]:
        """Busca links diretos de PDF para uma data específica.

        Faz GET na página principal /bandeirantes?data=DD/MM/YYYY
        e extrai os links diretos do DigitalOcean Spaces.

        Args:
            data_str: Data no formato DD/MM/YYYY.

        Returns:
            Dict numero_materia → url_direta_pdf.
        """
        url = f"{BASE_URL}/bandeirantes"
        response = await self.client.get(
            url,
            params={"data": data_str},
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        response.raise_for_status()
        html = response.text
        return extract_direct_pdf_links(html)

    async def download_pdf(self, pdf_url: str, output_path: Path) -> bool:
        """Faz download de um PDF via GET direto.

        Args:
            pdf_url: URL direta do PDF (DigitalOcean Spaces).
            output_path: Caminho onde salvar o arquivo.

        Returns:
            True se download bem-sucedido, False caso contrário.
        """
        try:
            response = await self.client.get(pdf_url)
            response.raise_for_status()

            # Verificar se é realmente um PDF
            content_type = response.headers.get("content-type", "")
            if (
                "pdf" not in content_type.lower()
                and "octet-stream" not in content_type.lower()
            ):
                logger.warning(
                    "  ⚠ Tipo inesperado para %s: %s (tamanho: %d bytes)",
                    pdf_url,
                    content_type,
                    len(response.content),
                )

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(response.content)
            return True

        except httpx.HTTPStatusError as e:
            logger.error(
                "  ✗ Erro HTTP %d ao baixar %s",
                e.response.status_code,
                pdf_url,
            )
            return False
        except Exception as e:
            logger.error("  ✗ Erro ao baixar %s: %s", pdf_url, e)
            return False


def extract_lei_numero(titulo: str) -> str:
    """Extrai o número da lei do título da publicação.

    Exemplos:
        "LEI Nº 1.263/2026, DE 23 DE ABRIL DE 2026." -> "1.263/2026"
        "LEI MUNICIPAL Nº 1.262/2026" -> "1.262/2026"
        "LEI COMPLEMENTAR N° 1231/2025" -> "1231/2025"
        "LEI 1199 2024 LOA 2025" -> "1199"

    Args:
        titulo: Título HTML da publicação.

    Returns:
        Número da lei extraído, ou string vazia.
    """
    # Remove tags HTML
    texto_limpo = re.sub(r"<[^>]*>", " ", titulo)
    texto_limpo = re.sub(r"\s+", " ", texto_limpo).strip()

    # Padrão estrito: título começa com tipo de lei + número
    # Evita capturar referências a leis federais no meio de avisos
    # Exige pelo menos um dígito no número da lei
    match = re.search(
        r"^(?:LEI\s+MUNICIPAL|LEI\s+COMPLEMENTAR|LEI\s+ORDINÁRIA|LEI)\s+"
        r"(?:N[º°]\s*)?"
        r"(\d[\d.]*(?:/\d{4})?)",
        texto_limpo,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()

    return ""
