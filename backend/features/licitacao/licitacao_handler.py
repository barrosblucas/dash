"""
Proxy routes para licitações (processos de licitação).

Busca dados das APIs externas ComprasBR e Quality (HTML)
e retorna com tipagem Pydantic.
Apenas orquestração HTTP — delega para adapter.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from backend.features.licitacao.licitacao_adapter import (
    ExternalAPIError,
    fetch_dispensas_quality,
    fetch_licitacao_comprasbr_detalhe,
    fetch_licitacoes_comprasbr,
    parse_dispensas_from_html,
)
from backend.features.licitacao.licitacao_types import (
    DispensasLicitacaoResponse,
    LicitacaoComprasBRDetailItem,
    LicitacaoComprasBRResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/licitacoes", tags=["licitacoes"])


def _handle_external_error(exc: ExternalAPIError) -> HTTPException:
    """Converte erro do adapter em HTTPException."""
    return HTTPException(status_code=502, detail=exc.message)


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
    try:
        items, metadata = await fetch_licitacoes_comprasbr(page=page, size=size)
    except ExternalAPIError as exc:
        raise _handle_external_error(exc) from exc

    return LicitacaoComprasBRResponse(
        items=items,
        totalPages=metadata["totalPages"],
        totalElements=metadata["totalElements"],
        page=metadata["page"],
        size=metadata["size"],
    )


@router.get(
    "/comprasbr/{licitacao_id}",
    response_model=LicitacaoComprasBRDetailItem,
    summary="Detalhes de uma licitação do ComprasBR",
)
async def get_licitacao_comprasbr_detalhe(
    licitacao_id: int,
) -> LicitacaoComprasBRDetailItem:
    """Proxy para a API de detalhes de licitação do ComprasBR.

    Retorna informações completas de um processo licitatório específico,
    incluindo datas de envio de propostas, pregoeiro, legislação e
    documentos anexados (editais).
    """
    try:
        return await fetch_licitacao_comprasbr_detalhe(licitacao_id)
    except ExternalAPIError as exc:
        raise _handle_external_error(exc) from exc


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
        html = await fetch_dispensas_quality()
    except ExternalAPIError as exc:
        raise _handle_external_error(exc) from exc

    items = parse_dispensas_from_html(html)

    return DispensasLicitacaoResponse(
        items=items,
        quantidade=len(items),
    )
