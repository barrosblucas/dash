"""
Proxy routes para licitações (processos de licitação).

Busca dados das APIs externas ComprasBR e Quality (HTML)
e retorna com tipagem Pydantic.
"""

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from selectolax.lexbor import LexborHTMLParser

from backend.api.schemas_licitacao import (
    DispensaLicitaçãoItem,
    DispensasLicitacaoResponse,
    LicitacaoComprasBRDetailItem,
    LicitacaoComprasBRDocumento,
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

    return LicitacaoComprasBRResponse(
        items=items,
        totalPages=data.get("totalPages", 0),
        totalElements=data.get("totalElements", 0),
        page=data.get("number", page),
        size=data.get("size", size),
    )


_COMPRASBR_DETAIL_URL = (
    "https://app.comprasbr.com.br/licitacao-readonly"
    "/api/licitacao/public/portal/paginaInterna"
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
        raise HTTPException(
            status_code=502,
            detail=(
                f"Erro ao buscar detalhes na API ComprasBR: "
                f"HTTP {exc.response.status_code}"
            ),
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "Erro de conexão ao buscar detalhes ComprasBR (id=%s): %s",
            licitacao_id,
            exc,
        )
        raise HTTPException(
            status_code=502,
            detail="Erro de conexão com a API ComprasBR",
        ) from exc

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


def _parse_dispensas_from_html(html: str) -> list[DispensaLicitaçãoItem]:
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
