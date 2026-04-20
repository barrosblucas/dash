"""
Proxy route para Movimento Extra Orçamentário do portal Quality.

Busca dados diretamente da API externa Quality e retorna com resumo
agrupado por fundos municipais.
"""

import asyncio
import logging
import re
from typing import Literal, TypedDict

import httpx
from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas import (
    FundoResumo,
    InsightItem,
    MovimentoExtraAnualResponse,
    MovimentoExtraItem,
    MovimentoExtraResponse,
    ResumoMensalItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/movimento-extra", tags=["movimento-extra"])

# --- Constantes da API externa ---

_BASE_URL = (
    "https://portalquality.qualitysistemas.com.br"
    "/movimento_extra_orcamentario/prefeitura_municipal_de_bandeirantes"
)
_ENDPOINT = "buscaMovimentoPorAno"
_REQUEST_TIMEOUT = 30.0

# --- Glossário de fundos municipais ---

FUNDOS_GLOSSARIO: dict[str, str] = {
    "FUNDEB": (
        "Fundo de Manutenção e Desenvolvimento da Educação Básica"
        " e de Valorização dos Profissionais da Educação"
    ),
    "FMAS": "Fundo Municipal de Assistência Social",
    "FMIS": "Fundo Municipal da Saúde",
    "FMDCA": "Fundo Municipal dos Direitos da Criança e do Adolescente",
    "FUNCESP": (
        "Fundo de Previdência dos Servidores Públicos Municipais"
    ),
    "FUMDES": (
        "Fundo Municipal de Desenvolvimento Econômico e Social"
    ),
    "FUNDURB": "Fundo Municipal de Urbanização",
    "FMDA": "Fundo Municipal de Desenvolvimento Agropecuário",
    "FUNDEGER": (
        "Fundo de Desenvolvimento do Ensino Fundamental"
        " e de Valorização do Magistério"
    ),
}

_FUNDO_PATTERN = re.compile(r"\(([A-Z]{3,})\)")

# --- Categorias de insight ---
# Mapeia padrões de descrição para categorias agregadas
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


def _extract_fundo(descricao: str) -> tuple[str, str]:
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


async def _fetch_tipo(
    ano: int, mes: int, tipo: str
) -> list[MovimentoExtraItem]:
    """Busca itens de um tipo (R ou D) na API externa."""
    params: dict[str, str] = {"ano": str(ano), "mes": str(mes), "tipo": tipo}
    url = f"{_BASE_URL}/{_ENDPOINT}"

    try:
        async with httpx.AsyncClient(
            timeout=_REQUEST_TIMEOUT,
        ) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "HTTP %s ao buscar movimento extra (ano=%s mes=%s tipo=%s)",
            exc.response.status_code,
            ano,
            mes,
            tipo,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                f"Erro ao buscar dados na API externa: "
                f"HTTP {exc.response.status_code}"
            ),
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "Erro de conexão ao buscar movimento extra: %s", exc
        )
        raise HTTPException(
            status_code=502,
            detail="Erro de conexão com a API externa",
        ) from exc

    if not isinstance(data, list):
        logger.warning(
            "Resposta inesperada da API externa: %s", type(data)
        )
        return []

    return [MovimentoExtraItem(**item) for item in data]


def _compute_insights(
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


def _build_fundos_resumo(
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
        sigla, descricao_completa = _extract_fundo(item.descricao)
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
    tipos_para_buscar = (
        ["R", "D"] if tipo == "AMBOS" else [tipo]
    )

    items: list[MovimentoExtraItem] = []
    for t in tipos_para_buscar:
        items.extend(await _fetch_tipo(ano, mes, t))

    total_receitas = sum(
        item.valor_recebido for item in items if item.tipo == "R"
    )
    total_despesas = sum(
        item.valor_recebido for item in items if item.tipo == "D"
    )

    return MovimentoExtraResponse(
        items=items,
        total_receitas=total_receitas,
        total_despesas=total_despesas,
        saldo=total_receitas - total_despesas,
        quantidade=len(items),
        fundos_resumo=_build_fundos_resumo(items),
        insights_receitas=_compute_insights(items, "R"),
        insights_despesas=_compute_insights(items, "D"),
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
        tasks.append(_fetch_tipo(ano, mes, "R"))
        tasks.append(_fetch_tipo(ano, mes, "D"))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Agrupar resultados
    all_items: list[MovimentoExtraItem] = []
    mensal: list[ResumoMensalItem] = []

    for mes in range(1, 13):
        receitas_idx = (mes - 1) * 2
        despesas_idx = (mes - 1) * 2 + 1

        receitas_raw = results[receitas_idx]
        despesas_raw = results[despesas_idx]

        receitas_items = (
            receitas_raw if isinstance(receitas_raw, list) else []
        )
        despesas_items = (
            despesas_raw if isinstance(despesas_raw, list) else []
        )

        all_items.extend(receitas_items)
        all_items.extend(despesas_items)

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

    total_receitas = sum(i.valor_recebido for i in all_items if i.tipo == "R")
    total_despesas = sum(i.valor_recebido for i in all_items if i.tipo == "D")

    return MovimentoExtraAnualResponse(
        ano=ano,
        total_receitas=round(total_receitas, 2),
        total_despesas=round(total_despesas, 2),
        saldo=round(total_receitas - total_despesas, 2),
        quantidade_total=len(all_items),
        insights_receitas=_compute_insights(all_items, "R", 6),
        insights_despesas=_compute_insights(all_items, "D", 6),
        evolucao_mensal=mensal,
    )
