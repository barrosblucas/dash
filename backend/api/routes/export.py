"""
Rotas da API para export de dados.
Dashboard Financeiro - Bandeirantes MS
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from io import BytesIO
import pandas as pd
from datetime import datetime

from backend.infrastructure.database.connection import get_db
from backend.infrastructure.repositories.sql_receita_repository import (
    SQLReceitaRepository,
)
from backend.infrastructure.repositories.sql_despesa_repository import (
    SQLDespesaRepository,
)
from backend.domain.entities.receita import TipoReceita
from backend.domain.entities.despesa import TipoDespesa

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/receitas/excel", summary="Exportar receitas para Excel")
async def export_receitas_excel(
    ano: Optional[int] = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    tipo: Optional[str] = Query(
        None, description="Filtrar por tipo (CORRENTE ou CAPITAL)"
    ),
    db: Session = Depends(get_db),
):
    """
    Exporta receitas para arquivo Excel (.xlsx).

    Args:
        ano: Filtra por ano específico
        tipo: Filtra por tipo de receita
        db: Sessão do banco de dados

    Returns:
        Arquivo Excel para download
    """
    repo = SQLReceitaRepository(db)

    # Converter tipo
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            tipo_enum = None

    # Buscar receitas
    receitas = repo.list(ano=ano, tipo=tipo_enum, limit=10000)

    # Converter para DataFrame
    data = []
    for r in receitas:
        data.append(
            {
                "ID": r.id,
                "Ano": r.ano,
                "Mês": r.mes,
                "Categoria": r.categoria,
                "Subcategoria": r.subcategoria or "",
                "Tipo": r.tipo.value,
                "Valor Previsto": float(r.valor_previsto),
                "Valor Arrecadado": float(r.valor_arrecadado),
                "Valor Anulado": float(r.valor_anulado),
                "Fonte": r.fonte,
            }
        )

    df = pd.DataFrame(data)

    # Criar arquivo Excel em memória
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Receitas", index=False)

        # Ajustar largura das colunas
        worksheet = writer.sheets["Receitas"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2) * 1.2
            worksheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)

    # Nome do arquivo
    filename = f"receitas_bandeirantes_{ano or 'todos'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/despesas/excel", summary="Exportar despesas para Excel")
async def export_despesas_excel(
    ano: Optional[int] = Query(None, ge=2013, le=2030, description="Filtrar por ano"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    db: Session = Depends(get_db),
):
    """
    Exporta despesas para arquivo Excel (.xlsx).

    Args:
        ano: Filtra por ano específico
        tipo: Filtra por tipo de despesa
        db: Sessão do banco de dados

    Returns:
        Arquivo Excel para download
    """
    repo = SQLDespesaRepository(db)

    # Converter tipo
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoDespesa[tipo.upper()]
        except KeyError:
            tipo_enum = None

    # Buscar despesas
    despesas = repo.list(ano=ano, tipo=tipo_enum, limit=10000)

    # Converter para DataFrame
    data = []
    for d in despesas:
        data.append(
            {
                "ID": d.id,
                "Ano": d.ano,
                "Mês": d.mes,
                "Categoria": d.categoria or "",
                "Subcategoria": d.subcategoria or "",
                "Tipo": d.tipo.value,
                "Valor Empenhado": float(d.valor_empenhado),
                "Valor Liquidado": float(d.valor_liquidado),
                "Valor Pago": float(d.valor_pago),
                "Fonte": d.fonte,
            }
        )

    df = pd.DataFrame(data)

    # Criar arquivo Excel em memória
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Despesas", index=False)

        # Ajustar largura das colunas
        worksheet = writer.sheets["Despesas"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2) * 1.2
            worksheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)

    # Nome do arquivo
    filename = f"despesas_bandeirantes_{ano or 'todos'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/kpis/excel", summary="Exportar KPIs para Excel")
async def export_kpis_excel(
    ano_inicio: Optional[int] = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: Optional[int] = Query(None, ge=2013, le=2030, description="Ano final"),
    db: Session = Depends(get_db),
):
    """
    Exporta KPIs consolidados para arquivo Excel (.xlsx).

    Args:
        ano_inicio: Ano inicial do período
        ano_fim: Ano final do período
        db: Sessão do banco de dados

    Returns:
        Arquivo Excel para download
    """
    from sqlalchemy import func
    from backend.infrastructure.database.models import ReceitaModel, DespesaModel

    # Definir período
    if ano_inicio is None:
        ano_inicio = 2016
    if ano_fim is None:
        ano_fim = datetime.now().year

    # Query receitas por ano
    receitas = (
        db.query(
            ReceitaModel.ano, func.sum(ReceitaModel.valor_arrecadado).label("total")
        )
        .filter(ReceitaModel.ano >= ano_inicio, ReceitaModel.ano <= ano_fim)
        .group_by(ReceitaModel.ano)
        .order_by(ReceitaModel.ano)
        .all()
    )

    # Query despesas por ano
    despesas = (
        db.query(DespesaModel.ano, func.sum(DespesaModel.valor_pago).label("total"))
        .filter(DespesaModel.ano >= ano_inicio, DespesaModel.ano <= ano_fim)
        .group_by(DespesaModel.ano)
        .order_by(DespesaModel.ano)
        .all()
    )

    # Criar DataFrame consolidado
    data = []
    receitas_dict = {r.ano: float(r.total) for r in receitas}
    despesas_dict = {d.ano: float(d.total) for d in despesas}

    for ano in range(ano_inicio, ano_fim + 1):
        r = receitas_dict.get(ano, 0)
        d = despesas_dict.get(ano, 0)
        data.append(
            {
                "Ano": ano,
                "Receitas (R$)": r,
                "Despesas (R$)": d,
                "Saldo (R$)": r - d,
                "Taxa de Execução (%)": (d / r * 100) if r > 0 else 0,
            }
        )

    df = pd.DataFrame(data)

    # Criar arquivo Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="KPIs Consolidados", index=False)

    output.seek(0)

    filename = f"kpis_bandeirantes_{ano_inicio}_{ano_fim}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
