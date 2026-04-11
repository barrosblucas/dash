"""
Rotas da API para KPIs (Key Performance Indicators).

Endpoints para consulta de indicadores financeiros.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from decimal import Decimal

from backend.api.schemas import KPIsResponse, KPIMensal, KPIAnual
from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.models import ReceitaModel, DespesaModel

router = APIRouter(prefix="/kpis", tags=["kpis"])


@router.get("", response_model=KPIsResponse, summary="KPIs principais")
async def obter_kpis(
    ano: Optional[int] = Query(
        None, ge=2013, le=2030, description="Ano para cálculo dos KPIs"
    ),
    db: Session = Depends(get_db),
):
    """
    Obtém os principais KPIs financeiros.

    Retorna indicadores financeiros consolidados por ano ou mês.
    Se nenhum ano for especificado, retorna o ano mais recente.

    Args:
        ano: Ano para cálculo dos KPIs. SeNone, usa o ano mais recente.
        db: Sessão do banco de dados injetada.

    Returns:
        KPIs consolidados incluindo totais de receitas e despesas, saldo,percentuais de execução.

    Example:
        GET /api/v1/kpis/
        GET /api/v1/kpis/?ano=2023
    """
    # Se ano não especificado, busca o ano mais recente
    if ano is None:
        ano_recente_receita = db.query(func.max(ReceitaModel.ano)).scalar()
        ano_recente_despesa = db.query(func.max(DespesaModel.ano)).scalar()
        ano = max(ano_recente_receita or 2013, ano_recente_despesa or 2013)

    # Calcula totais de receitas
    total_receitas = db.query(func.sum(ReceitaModel.valor_arrecadado)).filter(
        ReceitaModel.ano == ano
    ).scalar() or Decimal("0")

    # Calcula totais de despesas
    total_despesas = db.query(func.sum(DespesaModel.valor_pago)).filter(
        DespesaModel.ano == ano
    ).scalar() or Decimal("0")

    # Calcula saldo
    saldo = total_receitas - total_despesas

    # Calcula percentuais de execução
    total_previsto = db.query(func.sum(ReceitaModel.valor_previsto)).filter(
        ReceitaModel.ano == ano
    ).scalar() or Decimal("0")

    percentual_exec_receita = None
    if total_previsto > 0:
        percentual_exec_receita = (total_receitas / total_previsto) * 100

    total_empenhado = db.query(func.sum(DespesaModel.valor_empenhado)).filter(
        DespesaModel.ano == ano
    ).scalar() or Decimal("0")

    percentual_exec_despesa = None
    if total_empenhado > 0:
        percentual_exec_despesa = (total_despesas / abs(total_empenhado)) * 100

    return KPIsResponse(
        periodo=str(ano),
        receitas_total=total_receitas,
        despesas_total=total_despesas,
        saldo=saldo,
        percentual_execucao_receita=percentual_exec_receita,
        percentual_execucao_despesa=percentual_exec_despesa,
    )


@router.get("/mensal/{ano}", response_model=KPIsResponse, summary="KPIs mensais")
async def obter_kpis_mensal(
    ano: int,
    db: Session = Depends(get_db),
):
    """
    Obtém KPIsfinanceiros por mêsdo ano.

    Retorna indicadores financeiros calculados para cada mês do ano.

    Args:
        ano: Ano para cálculo dos KPIs.
        db: Sessão do banco de dados injetada.

    Returns:
        KPIs mensais com totais de receitas e despesas por mês.

    Example:
        GET /api/v1/kpis/mensal/2023
    """
    if ano < 2013 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano deve estar entre 2013 e 2030")

    # Consulta receitas por mês
    receitas_mensais = (
        db.query(
            ReceitaModel.mes, func.sum(ReceitaModel.valor_arrecadado).label("total")
        )
        .filter(ReceitaModel.ano == ano)
        .group_by(ReceitaModel.mes)
        .all()
    )

    receitas_dict = {r.mes: r.total for r in receitas_mensais}

    # Consulta despesas por mês
    despesas_mensais = (
        db.query(DespesaModel.mes, func.sum(DespesaModel.valor_pago).label("total"))
        .filter(DespesaModel.ano == ano)
        .group_by(DespesaModel.mes)
        .all()
    )

    despesas_dict = {d.mes: d.total for d in despesas_mensais}

    # Monta KPIs mensais
    kpis_mensais = []
    for mes in range(1, 13):
        total_receitas = Decimal(str(receitas_dict.get(mes, 0)))
        total_despesas = Decimal(str(despesas_dict.get(mes, 0)))

        if total_receitas > 0 or total_despesas > 0:
            kpis_mensais.append(
                KPIMensal(
                    mes=mes,
                    ano=ano,
                    total_receitas=total_receitas,
                    total_despesas=total_despesas,
                    saldo=total_receitas - total_despesas,
                )
            )

    # Totais do ano
    total_receitas_ano = sum(Decimal(str(r.total)) for r in receitas_mensais)
    total_despesas_ano = sum(Decimal(str(d.total)) for d in despesas_mensais)

    return KPIsResponse(
        periodo=str(ano),
        receitas_total=total_receitas_ano,
        despesas_total=total_despesas_ano,
        saldo=total_receitas_ano - total_despesas_ano,
        kpis_mensais=kpis_mensais,
    )


@router.get("/anual", response_model=KPIsResponse, summary="KPIs anuais")
async def obter_kpis_anuais(
    ano_inicio: Optional[int] = Query(
        None, ge=2013, le=2030, description="Ano inicial"
    ),
    ano_fim: Optional[int] = Query(None, ge=2013, le=2030, description="Ano final"),
    db: Session = Depends(get_db),
):
    """
    Obtém KPIsfinanceiros por ano.

    Retorna indicadores financeiros calculados para cada ano no período.

    Args:
        ano_inicio: Ano inicial do período (opcional).
        ano_fim: Ano final do período (opcional).
        db: Sessão do banco de dados injetada.

    Returns:
        KPIs anuais com totais de receitas e despesas por ano.

    Example:
        GET /api/v1/kpis/anual/
        GET /api/v1/kpis/anual/?ano_inicio=2020&ano_fim=2023
    """
    # Define período padrão
    if ano_inicio is None:
        ano_inicio = 2016

    if ano_fim is None:
        ano_fim = 2026

    if ano_inicio > ano_fim:
        raise HTTPException(
            status_code=400, detail="ano_inicio não pode ser maior que ano_fim"
        )

    # Consulta receitas por ano e tipo
    receitas_por_ano = (
        db.query(
            ReceitaModel.ano,
            ReceitaModel.tipo,
            func.sum(ReceitaModel.valor_arrecadado).label("total"),
        )
        .filter(and_(ReceitaModel.ano >= ano_inicio, ReceitaModel.ano <= ano_fim))
        .group_by(ReceitaModel.ano, ReceitaModel.tipo)
        .all()
    )

    # Organiza dados de receitas
    receitas_dict = {}
    for r in receitas_por_ano:
        if r.ano not in receitas_dict:
            receitas_dict[r.ano] = {
                "total": Decimal("0"),
                "correntes": Decimal("0"),
                "capital": Decimal("0"),
            }
        receitas_dict[r.ano]["total"] += Decimal(str(r.total))
        if r.tipo == "CORRENTE":
            receitas_dict[r.ano]["correntes"] += Decimal(str(r.total))
        else:
            receitas_dict[r.ano]["capital"] += Decimal(str(r.total))

    # Consulta despesas por ano e tipo
    despesas_por_ano = (
        db.query(
            DespesaModel.ano,
            DespesaModel.tipo,
            func.sum(DespesaModel.valor_pago).label("total"),
        )
        .filter(and_(DespesaModel.ano >= ano_inicio, DespesaModel.ano <= ano_fim))
        .group_by(DespesaModel.ano, DespesaModel.tipo)
        .all()
    )

    # Organiza dados de despesas
    despesas_dict = {}
    for d in despesas_por_ano:
        if d.ano not in despesas_dict:
            despesas_dict[d.ano] = {
                "total": Decimal("0"),
                "correntes": Decimal("0"),
                "capital": Decimal("0"),
            }
        despesas_dict[d.ano]["total"] += Decimal(str(d.total))
        if d.tipo == "CORRENTE":
            despesas_dict[d.ano]["correntes"] += Decimal(str(d.total))
        else:
            despesas_dict[d.ano]["capital"] += Decimal(str(d.total))

    # Monta KPIs anuais
    kpis_anuais = []
    for ano in range(ano_inicio, ano_fim + 1):
        total_receitas = receitas_dict.get(ano, {}).get("total", Decimal("0"))
        total_despesas = despesas_dict.get(ano, {}).get("total", Decimal("0"))

        if total_receitas > 0 or total_despesas > 0:
            kpis_anuais.append(
                KPIAnual(
                    ano=ano,
                    total_receitas=total_receitas,
                    total_despesas=total_despesas,
                    saldo=total_receitas - total_despesas,
                    receitas_correntes=receitas_dict.get(ano, {}).get("correntes"),
                    receitas_capital=receitas_dict.get(ano, {}).get("capital"),
                    despesas_correntes=despesas_dict.get(ano, {}).get("correntes"),
                    despesas_capital=despesas_dict.get(ano, {}).get("capital"),
                )
            )

    # Totais do período
    total_receitas_periodo = sum(k.total_receitas for k in kpis_anuais)
    total_despesas_periodo = sum(k.total_despesas for k in kpis_anuais)

    return KPIsResponse(
        periodo=f"{ano_inicio}-{ano_fim}",
        receitas_total=total_receitas_periodo,
        despesas_total=total_despesas_periodo,
        saldo=total_receitas_periodo - total_despesas_periodo,
        kpis_anuais=kpis_anuais,
    )


@router.get("/resumo", response_model=dict, summary="Resumo geral")
async def obter_resumo_geral(db: Session = Depends(get_db)):
    """
    Obtém resumo geral dos dados financeiros.

    Retorna estatísticas gerais do banco de dados como quantidade de registros,
    anos disponíveis, etc.

    Args:
        db: Sessão do banco de dados injetada.

    Returns:
        Dicionário com estatísticas gerais.

    Example:
        GET /api/v1/kpis/resumo/
    """
    # Contagem de registros
    total_receitas = db.query(func.count(ReceitaModel.id)).scalar() or 0
    total_despesas = db.query(func.count(DespesaModel.id)).scalar() or 0

    # Anos disponíveis
    anos_receitas = (
        db.query(ReceitaModel.ano).distinct().order_by(ReceitaModel.ano).all()
    )
    anos_despesas = (
        db.query(DespesaModel.ano).distinct().order_by(DespesaModel.ano).all()
    )

    anos_receitas = [a[0] for a in anos_receitas]
    anos_despesas = [a[0] for a in anos_despesas]

    todos_anos = sorted(set(anos_receitas + anos_despesas))

    # Período
    ano_min = min(todos_anos) if todos_anos else None
    ano_max = max(todos_anos) if todos_anos else None

    return {
        "total_registros": {
            "receitas": total_receitas,
            "despesas": total_despesas,
        },
        "anos_disponiveis": {
            "receitas": anos_receitas,
            "despesas": anos_despesas,
            "todos": todos_anos,
        },
        "periodo": {
            "inicio": ano_min,
            "fim": ano_max,
        },
        "status": "ok",
    }
