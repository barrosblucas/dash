"""Funções auxiliares de parsing para extração de dados de PDFs financeiros."""

from __future__ import annotations

import re
from decimal import Decimal

from backend.shared.pdf_types import (
    MESES_ABREV_MAP,
    MESES_MAP,
    SKIP_HEADERS,
    parse_valor_monetario,
)

# -- DETECÇÃO DE TIPO DE TABELA (RECEITAS) --


def _is_summary_table(header: list[str]) -> bool:
    """Verifica se é tabela de resumo mensal (Mês | Valor Arrecadado)."""
    if len(header) < 2:
        return False
    h0 = header[0].strip().upper()
    return h0 in ("MÊS", "MES", "MÊS/ANO") or (
        "VALOR ARRECADADO" in " ".join(header).upper() and h0 not in SKIP_HEADERS
    )


def _is_detail_table(header: list[str]) -> bool:
    """Verifica se é tabela detalhada com Previsto (Anual)."""
    header_str = " ".join(header).upper()
    return "PREVISTO" in header_str and "DETALHAMENTO" in header_str


# -- PARSING DE LINHAS (RECEITAS) --


def _parse_summary_row(
    linha: list[str | None],
) -> tuple[int | None, Decimal | None]:
    """Parseia linha de resumo mensal (Mês | Valor Arrecadado)."""
    if not linha or len(linha) < 2:
        return None, None

    mes_nome = str(linha[0]).strip().upper()
    if mes_nome not in MESES_MAP:
        return None, None

    mes = MESES_MAP[mes_nome]
    valor = parse_valor_monetario(str(linha[1]))
    return mes, valor


def _parse_detail_row(
    linha: list[str | None],
) -> tuple[str | None, Decimal | None, Decimal | None, Decimal | None]:
    """Parseia linha detalhada (Categoria | Previsto | Arrecadado | Anulado)."""
    if not linha or len(linha) < 3:
        return None, None, None, None

    categoria = str(linha[0]).strip()
    if not categoria or categoria.upper().strip() in SKIP_HEADERS:
        return None, None, None, None

    # Limpar newlines no nome da categoria
    categoria = categoria.replace("\n", " ").strip()

    previsto = parse_valor_monetario(str(linha[1])) if len(linha) > 1 else Decimal("0")
    arrecadado = (
        parse_valor_monetario(str(linha[2])) if len(linha) > 2 else Decimal("0")
    )
    anulado = parse_valor_monetario(str(linha[3])) if len(linha) > 3 else Decimal("0")

    return categoria, previsto, arrecadado, anulado


# -- DETECÇÃO DE TIPO DE TABELA (DESPESAS) --


def _is_expense_summary_table(header: list[str]) -> bool:
    """Verifica se é tabela de resumo mensal de despesas."""
    if len(header) < 4:
        return False
    h0 = header[0].strip().upper()
    h_rest = " ".join(header[1:]).upper()
    return h0 in ("MÊS", "MES") and "EMPENHADO" in h_rest


def _is_expense_breakdown_table(header: list[str]) -> bool:
    """Verifica se é tabela de breakdown por tipo de despesa."""
    if len(header) < 4:
        return False
    h0 = header[0].strip().upper()
    # A tabela de breakdown tem "Descrição" na primeira coluna
    # e nomes de meses nas demais. Usar substring para evitar problemas de encoding.
    if "DESCRIC" not in h0.replace("Ã", "A").replace("Ç", "C"):
        return False

    # Verificar se pelo menos uma coluna é nome de mês
    for h in header[1:]:
        h_clean = str(h).strip().upper()
        if h_clean in MESES_ABREV_MAP:
            return True
    return False


# -- PARSING DE LINHAS (DESPESAS) --


def _parse_expense_summary_row(
    linha: list[str | None],
) -> tuple[int, Decimal, Decimal, Decimal] | None:
    """Parseia linha de resumo mensal de despesas."""
    if not linha or len(linha) < 4:
        return None

    mes_nome = str(linha[0]).strip().upper()
    if mes_nome not in MESES_MAP:
        return None

    mes = MESES_MAP[mes_nome]
    empenhado = parse_valor_monetario(str(linha[1]))
    liquidado = parse_valor_monetario(str(linha[2]))
    pago = parse_valor_monetario(str(linha[3]))

    return mes, empenhado, liquidado, pago


def _parse_breakdown_header(header: list[str]) -> dict[int, int]:
    """
    Parseia header de tabela de breakdown.

    Returns:
        Dict mapeando índice da coluna -> número do mês
    """
    meses_cols: dict[int, int] = {}
    for idx, h in enumerate(header[1:], start=1):
        h_clean = str(h).strip().upper()
        if h_clean in MESES_ABREV_MAP:
            meses_cols[idx] = MESES_ABREV_MAP[h_clean]
    return meses_cols


def _parse_breakdown_row(
    linha: list[str | None],
    meses_cols: dict[int, int],
    breakdown: dict[tuple[str, int], Decimal],
) -> None:
    """
    Parseia linha de breakdown e atualiza o dict de breakdown.

    Formato: ["DESPESAS CORRENTES", "23.833.637,45", "5.962.462,83", ...]
    """
    if not linha or len(linha) < 2:
        return

    descricao = str(linha[0]).strip().upper()
    if descricao in SKIP_HEADERS or not descricao:
        return

    # Normalizar descrição para mapear tipo de despesa
    tipo_key = descricao
    if "CORRENTE" in tipo_key:
        tipo_key = "DESPESAS CORRENTES"
    elif "CAPITAL" in tipo_key:
        tipo_key = "DESPESAS DE CAPITAL"
    elif "CONTINGENCIA" in tipo_key or "CONTINGÊNCIA" in tipo_key:
        tipo_key = "RESERVA DE CONTINGÊNCIA"
    else:
        return

    for col_idx, mes_num in meses_cols.items():
        if col_idx < len(linha):
            valor = parse_valor_monetario(str(linha[col_idx]))
            breakdown[(tipo_key, mes_num)] = valor


# -- DETALHAMENTO HIERÁRQUICO --


def _detectar_nivel(leading_spaces: int) -> int:
    """Mapeia espaços à esquerda para nível hierárquico.

    Baseado na indentação real dos PDFs:
      1 espaço  → Nv1 (RECEITAS CORRENTES)
      2 espaços → Nv2 (IMPOSTOS, TAXAS...)
      4 espaços → Nv3 (IMPOSTOS)
      5 espaços → Nv4 (IMPOSTOS SOBRE O PATRIMÔNIO)
      7 espaços → Nv5 (IMPOSTO SOBRE A PROPRIEDADE...)
      9+ espaços → Nv6+
    """
    if leading_spaces <= 1:
        return 1
    elif leading_spaces <= 3:
        return 2
    elif leading_spaces <= 4:
        return 3
    elif leading_spaces <= 6:
        return 4
    elif leading_spaces <= 8:
        return 5
    else:
        return 6


def _parse_detail_text_line(
    line: str,
) -> tuple[str | None, tuple[Decimal, Decimal, Decimal]]:
    """
    Parseia uma linha de texto do detalhamento.

    Formato: "NOME_CATEGORIA    R$ 1.234,56    R$ 789,00    R$ 0,00"

    Args:
        line: Linha de texto com nome e valores monetários.

    Returns:
        Tupla com nome (ou None) e tupla de valores (previsto, arrecadado, anulado).
    """
    valor_pattern = r"R\$\s*[\d.,-]+"

    valores_match = list(re.finditer(valor_pattern, line))

    if len(valores_match) < 2:
        return None, (Decimal("0"), Decimal("0"), Decimal("0"))

    # O nome é tudo antes do primeiro valor
    first_val_start = valores_match[0].start()
    nome = line[:first_val_start].strip()

    if not nome or nome.upper() in SKIP_HEADERS:
        return None, (Decimal("0"), Decimal("0"), Decimal("0"))

    # Limpar newlines no nome
    nome = nome.replace("\n", " ").strip()

    previsto = parse_valor_monetario(valores_match[0].group())
    arrecadado = parse_valor_monetario(valores_match[1].group())
    anulado = (
        parse_valor_monetario(valores_match[2].group())
        if len(valores_match) > 2
        else Decimal("0")
    )

    return nome, (previsto, arrecadado, anulado)


def _detect_tipo_from_header(nome: str) -> str:
    """
    Detecta se o item de nível 1 é CORRENTE ou CAPITAL baseado no nome.

    Args:
        nome: Nome da categoria de nível 1.

    Returns:
        "CORRENTE" ou "CAPITAL".
    """
    nome_upper = nome.upper()
    if "CAPITAL" in nome_upper:
        return "CAPITAL"
    return "CORRENTE"
