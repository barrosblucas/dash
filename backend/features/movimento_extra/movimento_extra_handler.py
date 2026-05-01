"""
Handler para Movimento Extra Orçamentário — lê do banco local.

Os dados são sincronizados periodicamente pelo MovimentoExtraScheduler.
Este handler apenas consulta o cache local e aplica lógica de negócio.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.features.movimento_extra.movimento_extra_business import (
    build_fundos_resumo,
    compute_insights,
    compute_resumo_mensal,
    compute_totais,
)
from backend.features.movimento_extra.movimento_extra_data import (
    list_movimento_extra,
    list_movimento_extra_anual,
)
from backend.features.movimento_extra.movimento_extra_types import (
    MovimentoExtraAnualResponse,
    MovimentoExtraResponse,
)
from backend.shared.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/movimento-extra", tags=["movimento-extra"])


@router.get(
    "/busca",
    response_model=MovimentoExtraResponse,
    summary="Busca movimento extra orçamentário",
)
def busca_movimento_extra(
    ano: int = Query(..., description="Ano de referência"),
    mes: int = Query(..., ge=1, le=12, description="Mês (1-12)"),
    tipo: Literal["R", "D", "AMBOS"] = Query(
        ..., description="Tipo: R=Receitas, D=Despesas, AMBOS"
    ),
    db: Session = Depends(get_db),
) -> MovimentoExtraResponse:
    """Consulta movimento extra orçamentário do cache local.

    Os dados são sincronizados a cada 10 minutos da API Quality.
    """
    tipo_db = None if tipo == "AMBOS" else tipo

    items = list_movimento_extra(db, ano, mes, tipo_db)
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
def busca_anual(
    ano: int = Query(..., description="Ano de referência"),
    db: Session = Depends(get_db),
) -> MovimentoExtraAnualResponse:
    """Consulta resumo anual do movimento extra orçamentário do cache local."""
    all_items = list_movimento_extra_anual(db, ano)

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
