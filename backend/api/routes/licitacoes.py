"""
Proxy routes para licitações (processos de licitação).

Busca dados das APIs externas ComprasBR e Quality (HTML)
e retorna com tipagem Pydantic.
"""

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from selectolax.lexbor import LexborHTMLParser

from backend.api.schemas import (
    DispensaLicitaçãoItem,
    DispensasLicitacaoResponse,
    LicitacaoComprasBRItem,
    LicitacaoComprasBRResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/licitacoes", tags=["licitacoes"])

# --- Constantes das APIs externas ---

_COMPRASBR_URL = (
    "https://app.comprasbr.com.br/licitacao-readonly/api/licitacao"
    "/public/portal/processos/"
)
_QUALITY_URL = (
    "https://avisolicitacao.qualitysistemas.com.br"
    "/prefeitura_municipal_de_bandeirantes"
)
_REQUEST_TIMEOUT = 30.0


@router.get(
    "/comprasbr",
    response_model=LicitacaoComprasBRResponse,
    summary="Lista licitações do portal ComprasBR",
)
async def get_licitacoes_comprasbr(
    page: int = Query(1, ge=1, description="Página"),
    size: int = Query(100, ge=1, le=500, description="Itens por página"),
) -> LicitacaoComprasBRResponse:
    """Proxy para a API de licitações do ComprasBR (Mato Grosso do Sul).

    Retorna processos de licitação paginados com dados do município
    de Bandeirantes MS.
    """
    params = {
        "size": str(size),
        "page": str(page),
        "estado": "MS",
        "idMunicipio": "1275",
    }

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(_COMPRASBR_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar licitações ComprasBR (page=%s size=%s)",
            exc.response.status_code,
            page,
            size,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                f"Erro ao buscar dados na API ComprasBR: "
                f"HTTP {exc.response.status_code}"
            ),
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar licitações ComprasBR: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Erro de conexão com a API ComprasBR",
        ) from exc

    content = data.get("content", [])
    items = [
        LicitacaoComprasBRItem(
            id=item["id"],
            numeroEdital=item.get("numeroEdital", ""),
            objeto=item.get("objeto", ""),
            status=item.get("status", ""),
            modalidade=item.get("modalidade", ""),
            orgaoNome=item.get("orgaoNome", ""),
            dataAbertura=item.get("dataAbertura", ""),
        )
        for item in content
    ]

    return LicitacaoComprasBRResponse(
        items=items,
        totalPages=data.get("totalPages", 0),
        totalElements=data.get("totalElements", 0),
        page=data.get("number", page),
        size=data.get("size", size),
    )


def _parse_dispensas_from_html(html: str) -> list[DispensaLicitaçãoItem]:
    """Extrai entradas de dispensa do HTML do portal Quality."""
    tree = LexborHTMLParser(html)
    items: list[DispensaLicitaçãoItem] = []

    rows = tree.css("tr.modelo-Dispensa")
    for row in rows:
        cells = row.css("td")
        if len(cells) < 8:
            continue

        codigo = cells[0].text(strip=True)
        processo = cells[1].text(strip=True)
        disputa = cells[2].text(strip=True)
        criterio = cells[3].text(strip=True)
        tipo = cells[4].text(strip=True)
        data_abertura = cells[5].text(strip=True)
        data_julgamento = cells[6].text(strip=True)
        status = cells[7].text(strip=True)

        # O objeto fica na próxima <tr> (linha de detalhe)
        detail_row = row.next
        objeto = ""
        if detail_row is not None:
            detail_text = detail_row.text(strip=True)
            if detail_text:
                objeto = detail_text

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
            )
        )

    return items


@router.get(
    "/dispensas",
    response_model=DispensasLicitacaoResponse,
    summary="Lista dispensas de licitação do portal Quality",
)
async def get_dispensas_licitacao() -> DispensasLicitacaoResponse:
    """Proxy que extrai dispensas de licitação do portal Quality via HTML.

    Realiza scraping da página e retorna apenas entradas do tipo Dispensa.
    """
    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            response = await client.get(_QUALITY_URL)
            response.raise_for_status()
            html = response.text
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar dispensas no portal Quality",
            exc.response.status_code,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                f"Erro ao buscar dados no portal Quality: "
                f"HTTP {exc.response.status_code}"
            ),
        ) from exc
    except httpx.RequestError as exc:
        logger.error("Erro de conexão ao buscar dispensas Quality: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Erro de conexão com o portal Quality",
        ) from exc

    items = _parse_dispensas_from_html(html)

    return DispensasLicitacaoResponse(
        items=items,
        quantidade=len(items),
    )
