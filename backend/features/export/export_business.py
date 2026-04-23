"""
Lógica de domínio para exportação de dados (Excel).

SEM SQLAlchemy, SEM FastAPI.
Recebe dados primitivos e gera arquivos Excel em memória.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any

import pandas as pd


def receitas_to_dataframe(receitas: list) -> pd.DataFrame:
    """Converte lista de entidades Receita para DataFrame."""
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
    return pd.DataFrame(data)


def despesas_to_dataframe(despesas: list) -> pd.DataFrame:
    """Converte lista de entidades Despesa para DataFrame."""
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
    return pd.DataFrame(data)


def kpis_to_dataframe(
    receitas_por_ano: list[tuple[int, float]],
    despesas_por_ano: list[tuple[int, float]],
    ano_inicio: int,
    ano_fim: int,
) -> pd.DataFrame:
    """Converte dados de KPIs por ano para DataFrame consolidado."""
    receitas_dict = dict(receitas_por_ano)
    despesas_dict = dict(despesas_por_ano)

    data = []
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
    return pd.DataFrame(data)


def dataframe_to_excel(
    df: pd.DataFrame,
    sheet_name: str,
    auto_adjust_width: bool = True,
) -> BytesIO:
    """Gera arquivo Excel em memória a partir de um DataFrame."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name=sheet_name, index=False)

        if auto_adjust_width:
            _adjust_column_widths(writer.sheets[sheet_name])

    output.seek(0)
    return output


def _adjust_column_widths(worksheet: Any) -> None:
    """Ajusta largura das colunas baseado no conteúdo."""
    for column in worksheet.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except Exception:
                pass
        adjusted_width = (max_length + 2) * 1.2
        worksheet.column_dimensions[column_letter].width = adjusted_width


def generate_filename(prefix: str, suffix: str = "") -> str:
    """Gera nome de arquivo com timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_bandeirantes_{suffix}_{timestamp}.xlsx" if suffix else f"{prefix}_bandeirantes_{timestamp}.xlsx"
