"""
Adaptador para APIs externas de licitação (ACL).

Encapsula chamadas HTTP para ComprasBR e Quality,
conversão de JSON/HTML para entidades tipadas.
Não conhece FastAPI — retorna dados de domínio ou lança exceções de domínio.
"""

from __future__ import annotations

import logging

import httpx
from selectolax.lexbor import LexborHTMLParser

from backend.features.licitacao.licitacao_types import (
    DispensaLicitaçãoItem,
    LicitacaoComprasBRDetailItem,
    LicitacaoComprasBRDocumento,
    LicitacaoComprasBRItem,
)

logger = logging.getLogger(__name__)

# --- Constantes das APIs externas ---

_COMPRASBR_URL = (
    "https://app.comprasbr.com.br/licitacao-readonly/api/licitacao"
    "/public/portal/processos/"
)
_COMPRASBR_DETAIL_URL = (
    "https://app.comprasbr.com.br/licitacao-readonly"
    "/api/licitacao/public/portal/paginaInterna"
)
_QUALITY_URL = (
    "https://avisolicitacao.qualitysistemas.com.br"
    "/prefeitura_municipal_de_bandeirantes"
)
_REQUEST_TIMEOUT = 30.0


class ExternalAPIError(Exception):
    """Erro ao comunicar com API externa."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_licitacoes_comprasbr(
    page: int = 1,
    size: int = 100,
) -> tuple[list[LicitacaoComprasBRItem], dict]:
    """Busca licitações do portal ComprasBR.

    Returns:
        Tupla (items, metadata) onde metadata contém totalPages, totalElements, page, size.
    """
    params = {
        "size": str(size),
        "page": str(page),
        "estado": "MS",
        "idMunicipio": "1275",
    }

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(
                _COMPRASBR_URL,
                params=params,
                headers={"Referer": "https://comprasbr.com.br/"},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar licitações ComprasBR (page=%s size=%s)",
            exc.response.status_code,
            page,
            size,
        )
        raise ExternalAPIError(
            f"Erro ao buscar dados na API ComprasBR: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar licitações ComprasBR: %s", exc)
        raise ExternalAPIError("Erro de conexão com a API ComprasBR") from exc

    content = data.get("items", data.get("content", []))
    items = [
        LicitacaoComprasBRItem(
            id=item["id"],
            numeroEdital=item.get("numeroEdital", ""),
            objeto=item.get("objeto", ""),
            status=item.get("status", ""),
            modalidade=item.get("modalidade", ""),
            orgaoNome=item.get("orgaoNome", ""),
            dataAbertura=item.get("dataAbertura", ""),
            urlProcesso=(
                f"https://comprasbr.com.br/pregao-eletronico-detalhe/"
                f"?idlicitacao={item['id']}"
            ),
        )
        for item in content
    ]

    metadata = {
        "totalPages": data.get("totalPages", 0),
        "totalElements": data.get("totalElements", 0),
        "page": data.get("number", page),
        "size": data.get("size", size),
    }

    return items, metadata


async def fetch_licitacao_comprasbr_detalhe(
    licitacao_id: int,
) -> LicitacaoComprasBRDetailItem:
    """Busca detalhes de uma licitação do portal ComprasBR."""
    url = f"{_COMPRASBR_DETAIL_URL}/idLicitacao={licitacao_id}"

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(
                url,
                headers={"Referer": "https://comprasbr.com.br/"},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar detalhes ComprasBR (id=%s)",
            exc.response.status_code,
            licitacao_id,
        )
        raise ExternalAPIError(
            f"Erro ao buscar detalhes na API ComprasBR: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "Erro de conexão ao buscar detalhes ComprasBR (id=%s): %s",
            licitacao_id,
            exc,
        )
        raise ExternalAPIError("Erro de conexão com a API ComprasBR") from exc

    orgao = data.get("orgao", {}) or {}
    documentos_raw = data.get("documentos", []) or []
    documentos = [
        LicitacaoComprasBRDocumento(
            id=doc["id"],
            tipo=doc.get("tipo", ""),
            arquivoNome=doc.get("arquivoNome", ""),
            arquivoUri=doc.get("arquivoUri", ""),
        )
        for doc in documentos_raw
        if doc.get("arquivoUri")
    ]

    return LicitacaoComprasBRDetailItem(
        id=data["id"],
        numeroEdital=data.get("numeroEdital", ""),
        numProcesso=data.get("numProcesso", ""),
        objeto=data.get("objeto", ""),
        status=data.get("status", ""),
        modalidade=data.get("modalidade", ""),
        fase=data.get("fase", ""),
        orgaoNome=orgao.get("nome", ""),
        dataAbertura=data.get("dataAbertura", ""),
        dataIniEnvioProposta=data.get("dataIniEnvioProposta"),
        dataFimEnvioProposta=data.get("dataFimEnvioProposta"),
        tipoDisputa=data.get("tipoDisputa", ""),
        modoDisputa=data.get("modoDisputa", ""),
        pregoeiro=data.get("pregoeiro", ""),
        legislacao=data.get("legislacao", ""),
        urlProcesso=(
            f"https://comprasbr.com.br/pregao-eletronico-detalhe/"
            f"?idlicitacao={data['id']}"
        ),
        documentos=documentos,
    )


async def fetch_dispensas_quality() -> str:
    """Busca HTML de dispensas do portal Quality.

    Returns:
        HTML bruto da página.
    """
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(_QUALITY_URL)
            response.raise_for_status()
            return response.text
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar dispensas no portal Quality",
            exc.response.status_code,
        )
        raise ExternalAPIError(
            f"Erro ao buscar dados no portal Quality: HTTP {exc.response.status_code}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar dispensas Quality: %s", exc)
        raise ExternalAPIError("Erro de conexão com o portal Quality") from exc


def parse_dispensas_from_html(html: str) -> list[DispensaLicitaçãoItem]:
    """Extrai entradas de licitação do HTML do portal Quality.

    O portal agrupa licitações em blocos de 4 <tr>s consecutivos
    dentro do primeiro <tbody>. Cada bloco contém:
      1. header com 10 <td>s (dados principais)
      2. <tr> vazio
      3. <tr> vazio
      4. <tr> com 1 <td> contendo o texto do objeto.
    """
    tree = LexborHTMLParser(html)
    items: list[DispensaLicitaçãoItem] = []

    tbody = tree.css_first("tbody")
    if tbody is None:
        return items

    rows = tbody.css("tr")
    i = 0
    while i < len(rows):
        row = rows[i]
        cells = row.css("td")
        if len(cells) != 10:
            i += 1
            continue

        codigo = cells[0].text(strip=True)
        processo = cells[1].text(strip=True)
        modalidade = cells[2].text(strip=True)
        disputa = cells[3].text(strip=True)
        criterio = cells[4].text(strip=True)
        tipo = cells[5].text(strip=True)
        data_abertura = cells[6].text(strip=True)
        data_julgamento = cells[7].text(strip=True)
        status = cells[8].text(strip=True)

        # Busca o objeto nas linhas seguintes
        objeto = ""
        j = i + 1
        while j < len(rows):
            next_cells = rows[j].css("td")
            if len(next_cells) == 1:
                text = next_cells[0].text(strip=True)
                if text.startswith("Objeto"):
                    objeto = text
                    break
            j += 1

        url_processo = (
            f"https://avisolicitacao.qualitysistemas.com.br"
            f"/prefeitura_municipal_de_bandeirantes/{codigo}"
        )

        items.append(
            DispensaLicitaçãoItem(
                codigo=codigo,
                processo=processo,
                disputa=disputa,
                criterio=criterio,
                tipo=tipo,
                dataAbertura=data_abertura,
                dataJulgamento=data_julgamento,
                status=status,
                objeto=objeto,
                urlProcesso=url_processo,
                modalidade=modalidade,
            )
        )
        i += 1

    return items
