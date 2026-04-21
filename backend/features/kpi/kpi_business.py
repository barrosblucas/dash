"""
Lógica de domínio pura para KPIs — cálculos e agregações.

SEM SQLAlchemy, SEM FastAPI, SEM HTTP.
Recebe dados primitivos e retorna estruturas de domínio.
"""

from __future__ import annotations

from decimal import Decimal

from backend.features.kpi.kpi_types import KPIAnual, KPIMensal, KPIsResponse


def calcular_kpis_anuais(
    total_receitas: Decimal,
    total_despesas: Decimal,
    total_previsto: Decimal,
    total_empenhado: Decimal,
    ano: int,
) -> KPIsResponse:
    """Calcula os KPIs principais para um ano."""
    saldo = total_receitas - total_despesas

    percentual_exec_receita = None
    if total_previsto > 0:
        percentual_exec_receita = (total_receitas / total_previsto) * 100

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


def calcular_kpis_mensais(
    receitas_mensais: list[tuple[int, Decimal]],
    despesas_mensais: list[tuple[int, Decimal]],
    ano: int,
) -> KPIsResponse:
    """Calcula KPIs mensais a partir de dados agrupados por mês."""
    receitas_dict = dict(receitas_mensais)
    despesas_dict = dict(despesas_mensais)

    kpis_mensais: list[KPIMensal] = []
    for mes in range(1, 13):
        total_r = receitas_dict.get(mes, Decimal("0"))
        total_d = despesas_dict.get(mes, Decimal("0"))

        if total_r > 0 or total_d > 0:
            kpis_mensais.append(
                KPIMensal(
                    mes=mes,
                    ano=ano,
                    total_receitas=total_r,
                    total_despesas=total_d,
                    saldo=total_r - total_d,
                )
            )

    total_receitas_ano = sum(valor for _, valor in receitas_mensais)
    total_despesas_ano = sum(valor for _, valor in despesas_mensais)

    return KPIsResponse(
        periodo=str(ano),
        receitas_total=total_receitas_ano,
        despesas_total=total_despesas_ano,
        saldo=total_receitas_ano - total_despesas_ano,
        kpis_mensais=kpis_mensais,
    )


def calcular_kpis_periodo(
    receitas_por_ano_tipo: list[tuple[int, str, Decimal]],
    despesas_por_ano_tipo: list[tuple[int, str, Decimal]],
    ano_inicio: int,
    ano_fim: int,
) -> KPIsResponse:
    """Calcula KPIs para um período multi-anual, agrupados por ano e tipo."""
    receitas_dict: dict[int, dict[str, Decimal]] = {}
    for ano, tipo, total in receitas_por_ano_tipo:
        if ano not in receitas_dict:
            receitas_dict[ano] = {"total": Decimal("0"), "CORRENTE": Decimal("0"), "CAPITAL": Decimal("0")}
        receitas_dict[ano]["total"] += total
        if tipo == "CORRENTE":
            receitas_dict[ano]["CORRENTE"] += total
        else:
            receitas_dict[ano]["CAPITAL"] += total

    despesas_dict: dict[int, dict[str, Decimal]] = {}
    for ano, tipo, total in despesas_por_ano_tipo:
        if ano not in despesas_dict:
            despesas_dict[ano] = {"total": Decimal("0"), "CORRENTE": Decimal("0"), "CAPITAL": Decimal("0")}
        despesas_dict[ano]["total"] += total
        if tipo == "CORRENTE":
            despesas_dict[ano]["CORRENTE"] += total
        else:
            despesas_dict[ano]["CAPITAL"] += total

    kpis_anuais: list[KPIAnual] = []
    for ano in range(ano_inicio, ano_fim + 1):
        total_r = receitas_dict.get(ano, {}).get("total", Decimal("0"))
        total_d = despesas_dict.get(ano, {}).get("total", Decimal("0"))

        if total_r > 0 or total_d > 0:
            kpis_anuais.append(
                KPIAnual(
                    ano=ano,
                    total_receitas=total_r,
                    total_despesas=total_d,
                    saldo=total_r - total_d,
                    receitas_correntes=receitas_dict.get(ano, {}).get("CORRENTE"),
                    receitas_capital=receitas_dict.get(ano, {}).get("CAPITAL"),
                    despesas_correntes=despesas_dict.get(ano, {}).get("CORRENTE"),
                    despesas_capital=despesas_dict.get(ano, {}).get("CAPITAL"),
                )
            )

    total_receitas_periodo = sum(k.total_receitas for k in kpis_anuais)
    total_despesas_periodo = sum(k.total_despesas for k in kpis_anuais)

    return KPIsResponse(
        periodo=f"{ano_inicio}-{ano_fim}",
        receitas_total=total_receitas_periodo,
        despesas_total=total_despesas_periodo,
        saldo=total_receitas_periodo - total_despesas_periodo,
        kpis_anuais=kpis_anuais,
    )
