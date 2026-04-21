"""
Lógica de domínio pura para Movimento Extra Orçamentário.

Agrupamentos por fundo, insights por categoria, totais.
SEM SQLAlchemy, SEM FastAPI, SEM HTTP.
"""

from __future__ import annotations

import re
from typing import TypedDict

from backend.features.movimento_extra.movimento_extra_types import (
    FundoResumo,
    InsightItem,
    MovimentoExtraItem,
    ResumoMensalItem,
)

# --- Glossário de fundos municipais ---

FUNDOS_GLOSSARIO: dict[str, str] = {
    "FUNDEB": (
        "Fundo de Manutenção e Desenvolvimento da Educação Básica"
        " e de Valorização dos Profissionais da Educação"
    ),
    "FMAS": "Fundo Municipal de Assistência Social",
    "FMIS": "Fundo Municipal da Saúde",
    "FMDCA": "Fundo Municipal dos Direitos da Criança e do Adolescente",
    "FUNCESP": "Fundo de Previdência dos Servidores Públicos Municipais",
    "FUMDES": "Fundo Municipal de Desenvolvimento Econômico e Social",
    "FUNDURB": "Fundo Municipal de Urbanização",
    "FMDA": "Fundo Municipal de Desenvolvimento Agropecuário",
    "FUNDEGER": (
        "Fundo de Desenvolvimento do Ensino Fundamental"
        " e de Valorização do Magistério"
    ),
}

_FUNDO_PATTERN = re.compile(r"\(([A-Z]{3,})\)")

# --- Categorias de insight ---

_CATEGORIAS_RECEITA = [
    ("INSS", r"^INSS"),
    ("IRRF", r"^IRRF"),
    ("ISSQN", r"ISSQN"),
    ("Banco do Brasil", r"BANCO DO BRASIL"),
    ("SICREDI", r"SICREDI"),
    ("CASSEMS", r"CASSEMS"),
    ("Sindicatos", r"(SINTEBAND|S\.S\.P\.M\.B\.|SSPMB|SIN.?CARD)"),
    ("Caixa Econômica", r"CAIXA ECONOMICA"),
    ("Consignações", r"CONSIGNA"),
]

_CATEGORIAS_DESPESA = [
    ("INSS", r"^INSS"),
    ("CASSEMS", r"CASSEMS"),
    ("Banco do Brasil", r"BANCO DO BRASIL"),
    ("SICREDI", r"SICREDI"),
    ("IRRF", r"^IRRF"),
    ("Sindicatos", r"(SINTEBAND|S\.S\.P\.M\.B\.|SSPMB|SIN.?CARD)"),
    ("Benefícios", r"(SAL[AÁ]RIO\s+(FAM[IÍ]LIA|MATERNIDADE))"),
    ("Seguros", r"SEGURO"),
    ("Judicial", r"DESCONTO JUDICIAL"),
]

_GLOSSARIO_INSIGHTS = {
    "INSS": "Contribuição previdenciária dos servidores públicos municipais",
    "IRRF": "Imposto de Renda Retido na Fonte sobre folha de pagamento",
    "ISSQN": "Imposto sobre Serviços retido de prestadores e empresas",
    "Banco do Brasil": "Consignações bancárias dos servidores via Banco do Brasil",
    "SICREDI": "Consignações bancárias dos servidores via SICREDI",
    "CASSEMS": "Plano de saúde dos servidores (Caixa de Assistência de MS)",
    "Sindicatos": "Contribuições sindicais dos servidores públicos",
    "Caixa Econômica": "Consignações bancárias via Caixa Econômica Federal",
    "Consignações": "Outras consignações em folha de pagamento",
    "Benefícios": "Pagamentos de salário-família e salário-maternidade",
    "Seguros": "Prêmios de seguro dos servidores",
    "Judicial": "Descontos determinados por decisão judicial",
    "Outros": "Demais movimentações extraordinárias",
}


def extract_fundo(descricao: str) -> tuple[str, str]:
    """Extrai sigla e nome completo do fundo a partir da descrição.

    Retorna (sigla, nome_completo). Se não encontrado, retorna
    ("OUTROS", "Outros Fundos e Movimentações").
    """
    match = _FUNDO_PATTERN.search(descricao)
    if match:
        sigla = match.group(1)
        if sigla in FUNDOS_GLOSSARIO:
            return sigla, FUNDOS_GLOSSARIO[sigla]
    return "OUTROS", "Outros Fundos e Movimentações"


def compute_insights(
    items: list[MovimentoExtraItem],
    tipo: str,
    max_items: int = 6,
) -> list[InsightItem]:
    """Agrupa itens por categoria e retorna os top N insights."""
    categorias = (
        _CATEGORIAS_RECEITA if tipo == "R" else _CATEGORIAS_DESPESA
    )
    tipo_items = [i for i in items if i.tipo == tipo]
    total_tipo = sum(i.valor_recebido for i in tipo_items)

    # Agrupar por categoria
    categorized: dict[str, list[MovimentoExtraItem]] = {}
    matched_codes: set[tuple[int, int]] = set()

    for cat_name, pattern in categorias:
        regex = re.compile(pattern, re.IGNORECASE)
        cat_items: list[MovimentoExtraItem] = []
        for item in tipo_items:
            key = (item.codigo, item.ent_codigo)
            if key in matched_codes:
                continue
            if regex.search(item.descricao):
                cat_items.append(item)
                matched_codes.add(key)
        if cat_items:
            categorized[cat_name] = cat_items

    # Itens não categorizados
    outros = [
        i for i in tipo_items
        if (i.codigo, i.ent_codigo) not in matched_codes
    ]
    if outros:
        categorized["Outros"] = outros

    # Ordenar por valor e limitar
    sorted_cats = sorted(
        categorized.items(),
        key=lambda x: sum(i.valor_recebido for i in x[1]),
        reverse=True,
    )

    result: list[InsightItem] = []
    for cat_name, cat_items in sorted_cats[:max_items]:
        valor = sum(i.valor_recebido for i in cat_items)
        pct = (valor / total_tipo * 100) if total_tipo > 0 else 0
        result.append(
            InsightItem(
                categoria=cat_name,
                valor=round(valor, 2),
                percentual=round(pct, 1),
                quantidade=len(cat_items),
                descricao=_GLOSSARIO_INSIGHTS.get(
                    cat_name, "Movimentação extraordinária"
                ),
            )
        )

    return result


def build_fundos_resumo(
    items: list[MovimentoExtraItem],
) -> list[FundoResumo]:
    """Agrupa itens por fundo e calcula totais."""

    class _FundoAccumulator(TypedDict):
        total_receitas: float
        total_despesas: float
        quantidade_itens: int
        descricao_completa: str

    fundos_data: dict[str, _FundoAccumulator] = {}

    for item in items:
        sigla, descricao_completa = extract_fundo(item.descricao)
        if sigla not in fundos_data:
            fundos_data[sigla] = {
                "total_receitas": 0.0,
                "total_despesas": 0.0,
                "quantidade_itens": 0,
                "descricao_completa": descricao_completa,
            }
        entry = fundos_data[sigla]
        entry["descricao_completa"] = descricao_completa
        entry["quantidade_itens"] += 1
        if item.tipo == "R":
            entry["total_receitas"] += item.valor_recebido
        else:
            entry["total_despesas"] += item.valor_recebido

    return [
        FundoResumo(
            fundo=sigla,
            descricao_completa=values["descricao_completa"],
            total_receitas=values["total_receitas"],
            total_despesas=values["total_despesas"],
            quantidade_itens=values["quantidade_itens"],
        )
        for sigla, values in fundos_data.items()
    ]


def compute_resumo_mensal(
    all_items: list[MovimentoExtraItem],
) -> list[ResumoMensalItem]:
    """Computa resumo mensal a partir de itens de todos os meses."""
    mensal: list[ResumoMensalItem] = []
    for mes in range(1, 13):
        receitas_items = [i for i in all_items if i.mes == mes and i.tipo == "R"]
        despesas_items = [i for i in all_items if i.mes == mes and i.tipo == "D"]

        total_r = sum(i.valor_recebido for i in receitas_items)
        total_d = sum(i.valor_recebido for i in despesas_items)

        mensal.append(
            ResumoMensalItem(
                mes=mes,
                total_receitas=round(total_r, 2),
                total_despesas=round(total_d, 2),
                saldo=round(total_r - total_d, 2),
            )
        )
    return mensal


def compute_totais(
    items: list[MovimentoExtraItem],
) -> tuple[float, float, float]:
    """Retorna (total_receitas, total_despesas, saldo) a partir dos itens."""
    total_r = sum(i.valor_recebido for i in items if i.tipo == "R")
    total_d = sum(i.valor_recebido for i in items if i.tipo == "D")
    return total_r, total_d, total_r - total_d
