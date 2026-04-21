"""
Proxy route para Movimento Extra Orçamentário do portal Quality.

Busca dados diretamente da API externa Quality e retorna com resumo
agrupado por fundos municipais.
Apenas orquestração HTTP — delega para adapter e business.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from backend.features.movimento_extra.movimento_extra_adapter import (
    MovimentoExtraAPIError,
    fetch_tipo,
)
from backend.features.movimento_extra.movimento_extra_business import (
    build_fundos_resumo,
    compute_insights,
    compute_resumo_mensal,
    compute_totais,
)
from backend.features.movimento_extra.movimento_extra_types import (
    MovimentoExtraAnualResponse,
    MovimentoExtraResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/movimento-extra", tags=["movimento-extra"])


def _handle_api_error(exc: MovimentoExtraAPIError) -> HTTPException:
    """Converte erro do adapter em HTTPException."""
    return HTTPException(status_code=502, detail=exc.message)


@router.get(
    "/busca",
    response_model=MovimentoExtraResponse,
    summary="Busca movimento extra orçamentário",
)
async def busca_movimento_extra(
    ano: int = Query(..., description="Ano de referência"),
    mes: int = Query(..., ge=1, le=12, description="Mês (1-12)"),
    tipo: Literal["R", "D", "AMBOS"] = Query(
        ..., description="Tipo: R=Receitas, D=Despesas, AMBOS"
    ),
) -> MovimentoExtraResponse:
    """Proxy para a API de movimento extra orçamentário do portal Quality.

    Busca receitas e/ou despesas extra orçamentárias e retorna
    com resumo financeiro e agrupamento por fundos municipais.
    """
    tipos_para_buscar = ["R", "D"] if tipo == "AMBOS" else [tipo]

    items = []
    for t in tipos_para_buscar:
        try:
            items.extend(await fetch_tipo(ano, mes, t))
        except MovimentoExtraAPIError as exc:
            raise _handle_api_error(exc) from exc

    total_r, total_d, saldo = compute_totais(items)

    return MovimentoExtraResponse(
        items=items,
        total_receitas=total_r,
        total_despesas=total_d,
        saldo=saldo,
        quantidade=len(items),
        fundos_resumo=build_fundos_resumo(items),
        insights_receitas=compute_insights(items, "R"),
        insights_despesas=compute_insights(items, "D"),
    )


@router.get(
    "/anual",
    response_model=MovimentoExtraAnualResponse,
    summary="Resumo anual do movimento extra orçamentário",
)
async def busca_anual(
    ano: int = Query(..., description="Ano de referência"),
) -> MovimentoExtraAnualResponse:
    """Busca dados de todos os 12 meses e retorna resumo anual consolidado.

    Faz chamadas paralelas à API externa para cada mês e agrega os resultados,
    gerando insights de receitas e despesas com as categorias mais relevantes.
    """
    # Buscar todos os meses em paralelo (R e D)
    tasks = []
    for mes in range(1, 13):
        tasks.append(fetch_tipo(ano, mes, "R"))
        tasks.append(fetch_tipo(ano, mes, "D"))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Agrupar resultados — erros viram lista vazia (parcial)
    all_items = []
    for result in results:
        if isinstance(result, list):
            all_items.extend(result)
        elif isinstance(result, MovimentoExtraAPIError):
            logger.warning("Erro parcial no fetch anual: %s", result.message)
        elif isinstance(result, BaseException):
            logger.warning("Erro inesperado no fetch anual: %s", result)

    total_r, total_d, saldo = compute_totais(all_items)

    return MovimentoExtraAnualResponse(
        ano=ano,
        total_receitas=round(total_r, 2),
        total_despesas=round(total_d, 2),
        saldo=round(saldo, 2),
        quantidade_total=len(all_items),
        insights_receitas=compute_insights(all_items, "R", 6),
        insights_despesas=compute_insights(all_items, "D", 6),
        evolucao_mensal=compute_resumo_mensal(all_items),
    )
