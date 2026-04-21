"""
Rotas da API para export de dados.
Dashboard Financeiro - Bandeirantes MS

Apenas orquestração HTTP — delega para data layer e export_business.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_data import SQLDespesaRepository
from backend.features.despesa.despesa_types import TipoDespesa
from backend.features.export.export_business import (
    dataframe_to_excel,
    despesas_to_dataframe,
    generate_filename,
    kpis_to_dataframe,
    receitas_to_dataframe,
)
from backend.features.receita.receita_data import SQLReceitaRepository
from backend.features.receita.receita_types import TipoReceita
from backend.shared.database.connection import get_db
from backend.shared.database.models import DespesaModel, ReceitaModel

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/receitas/excel", summary="Exportar receitas para Excel")
async def export_receitas_excel(
    ano: int | None = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    tipo: str | None = Query(
        None, description="Filtrar por tipo (CORRENTE ou CAPITAL)"
    ),
    db: Session = Depends(get_db),
):
    """
    Exporta receitas para arquivo Excel (.xlsx).
    """
    repo = SQLReceitaRepository(db)

    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            tipo_enum = None

    receitas = repo.list_all(ano=ano, tipo=tipo_enum, limit=10000)
    df = receitas_to_dataframe(receitas)
    output = dataframe_to_excel(df, "Receitas")
    filename = generate_filename("receitas", str(ano) if ano else "todos")

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/despesas/excel", summary="Exportar despesas para Excel")
async def export_despesas_excel(
    ano: int | None = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    tipo: str | None = Query(None, description="Filtrar por tipo"),
    db: Session = Depends(get_db),
):
    """
    Exporta despesas para arquivo Excel (.xlsx).
    """
    repo = SQLDespesaRepository(db)

    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoDespesa[tipo.upper()]
        except KeyError:
            tipo_enum = None

    despesas = repo.list_all(ano=ano, tipo=tipo_enum, limit=10000)
    df = despesas_to_dataframe(despesas)
    output = dataframe_to_excel(df, "Despesas")
    filename = generate_filename("despesas", str(ano) if ano else "todos")

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/kpis/excel", summary="Exportar KPIs para Excel")
async def export_kpis_excel(
    ano_inicio: int | None = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: int | None = Query(None, ge=2013, le=2030, description="Ano final"),
    db: Session = Depends(get_db),
):
    """
    Exporta KPIs consolidados para arquivo Excel (.xlsx).
    """
    if ano_inicio is None:
        ano_inicio = 2016
    if ano_fim is None:
        ano_fim = datetime.now().year

    receitas_raw = (
        db.query(ReceitaModel.ano, func.sum(ReceitaModel.valor_arrecadado).label("total"))
        .filter(ReceitaModel.ano >= ano_inicio, ReceitaModel.ano <= ano_fim)
        .group_by(ReceitaModel.ano)
        .order_by(ReceitaModel.ano)
        .all()
    )

    despesas_raw = (
        db.query(DespesaModel.ano, func.sum(DespesaModel.valor_pago).label("total"))
        .filter(DespesaModel.ano >= ano_inicio, DespesaModel.ano <= ano_fim)
        .group_by(DespesaModel.ano)
        .order_by(DespesaModel.ano)
        .all()
    )

    receitas_por_ano = [(r.ano, float(r.total)) for r in receitas_raw]
    despesas_por_ano = [(d.ano, float(d.total)) for d in despesas_raw]

    df = kpis_to_dataframe(receitas_por_ano, despesas_por_ano, ano_inicio, ano_fim)
    output = dataframe_to_excel(df, "KPIs Consolidados", auto_adjust_width=False)
    filename = generate_filename("kpis", f"{ano_inicio}_{ano_fim}")

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
