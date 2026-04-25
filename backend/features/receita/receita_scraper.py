"""
Parser de dados de receita retornados pela API QualitySistemas.

Converte JSON bruto dos endpoints Revenue e DetailingRevenue em
entidades de domínio (Receita e ReceitaDetalhamento).

Responsabilidade única: transformação de dados.  Não executa HTTP.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from backend.features.receita.receita_types import Receita, TipoReceita
from backend.shared.pdf_types import ReceitaDetalhamento

logger = logging.getLogger(__name__)

# --- Mapeamento mês-texto -> número (compatível com MARÇO e MARCO) ---
MESES_MAP: dict[str, int] = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARÇO": 3,
    "MARCO": 3,
    "ABRIL": 4,
    "MAIO": 5,
    "JUNHO": 6,
    "JULHO": 7,
    "AGOSTO": 8,
    "SETEMBRO": 9,
    "OUTUBRO": 10,
    "NOVEMBRO": 11,
    "DEZEMBRO": 12,
}

# Chaves mensais retornadas pelo endpoint DetailingRevenue
_MONTH_KEYS: tuple[str, ...] = (
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
)

# Prefixo usado para valores anulados por mês
_ANULADO_PREFIX = "anu_"


# ======================================================================
# Funções auxiliares de conversão (privadas ao módulo)
# ======================================================================


def _safe_decimal(value: Any) -> Decimal:
    """Converte um valor qualquer em Decimal de forma segura.

    Trata: None, string vazia, string com número, tipos numéricos.
    Retorna Decimal("0") para qualquer entrada inválida.
    """
    if value is None:
        return Decimal("0")

    if isinstance(value, int | float):
        return Decimal(str(value))

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return Decimal("0")
        try:
            return Decimal(stripped)
        except Exception:
            logger.debug("Valor decimal inválido ignorado: '%s'", stripped)
            return Decimal("0")

    return Decimal("0")


def _safe_int(value: Any, default: int = 0) -> int:
    """Converte um valor qualquer em int de forma segura.

    Trata: None, string vazia, string com número, tipos numéricos.
    Retorna *default* para qualquer entrada inválida.
    """
    if value is None:
        return default

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return default
        try:
            return int(stripped)
        except (ValueError, TypeError):
            logger.debug("Valor int inválido ignorado: '%s'", stripped)
            return default

    return default


def _detect_tipo_from_descricao(descricao: str) -> str:
    """Detecta se o item é CORRENTE ou CAPITAL pela descrição."""
    return "CAPITAL" if "CAPITAL" in descricao.upper() else "CORRENTE"


def _sum_monthly_values(
    item: dict[str, Any],
    keys: tuple[str, ...],
) -> Decimal:
    """Soma valores mensais de um item do DetailingRevenue.

    Campos sem dados chegam como string vazia ("") ou null.
    """
    total = Decimal("0")
    for key in keys:
        total += _safe_decimal(item.get(key))
    return total


def _clean_descricao(raw: str) -> str:
    """Limpa a descrição: strip + remove ponto final."""
    return raw.strip().rstrip(".")


# ======================================================================
# Classe principal
# ======================================================================


class ReceitaScraper:
    """Parser de receitas do QualitySistemas.

    Transforma payloads JSON dos endpoints Revenue e DetailingRevenue
    em entidades de domínio prontas para persistência.

    Não possui estado — todos os métodos recebem dados e retornam
    entidades novas.  Pode ser instanciado uma vez e reutilizado.
    """

    # ------------------------------------------------------------------
    # Receita mensal (endpoint Revenue)
    # ------------------------------------------------------------------

    def parse_revenue_monthly(
        self,
        data: list[dict[str, Any]],
        year: int,
    ) -> list[Receita]:
        """Converte resposta do endpoint Revenue em entidades Receita.

        Cada item do array contém ``mes`` (texto) e ``valorArrecadado``.
        Itens com mês desconhecido são ignorados.

        Args:
            data: Lista de dicts do endpoint Revenue.
            year: Ano de referência.

        Returns:
            Lista de entidades Receita — uma por mês válido.
        """
        receitas: list[Receita] = []

        for entry in data:
            mes_nome = str(entry.get("mes", "")).strip().upper()
            mes_num = MESES_MAP.get(mes_nome)
            if mes_num is None:
                logger.warning("Mês desconhecido ignorado: '%s'", mes_nome)
                continue

            valor_arrecadado = _safe_decimal(entry.get("valorArrecadado"))

            receitas.append(
                Receita(
                    ano=year,
                    mes=mes_num,
                    categoria="RECEITAS CORRENTES",
                    valor_previsto=Decimal("0"),
                    valor_arrecadado=valor_arrecadado,
                    valor_anulado=Decimal("0"),
                    tipo=TipoReceita.CORRENTE,
                    fonte=f"SCRAPING_{year}",
                )
            )

        logger.info(
            "parse_revenue_monthly: %d receitas criadas para %d", len(receitas), year
        )
        return receitas

    # ------------------------------------------------------------------
    # Detalhamento hierárquico (endpoint DetailingRevenue)
    # ------------------------------------------------------------------

    def parse_revenue_detailing(
        self,
        data: list[dict[str, Any]],
        year: int,
    ) -> list[ReceitaDetalhamento]:
        """Converte resposta do endpoint DetailingRevenue em entidades.

        Cada item possui campos mensais (janeiro..dezembro) para
        arrecadado e ``anu_janeiro``..``anu_dezembro`` para anulado.
        O valor previsto vem de ``previsao``.

        Args:
            data: Lista de dicts do endpoint DetailingRevenue.
            year: Ano de referência.

        Returns:
            Lista de ReceitaDetalhamento ordenada pelo índice original.
        """
        detalhamentos: list[ReceitaDetalhamento] = []

        for ordem, item in enumerate(data):
            descricao_raw = str(item.get("descricao", "")).strip()
            if not descricao_raw:
                logger.debug("Item sem descrição no índice %d — pulando", ordem)
                continue

            descricao = _clean_descricao(descricao_raw)
            nivel = _safe_int(item.get("nivel", 0))
            tipo = _detect_tipo_from_descricao(descricao)
            valor_previsto = _safe_decimal(item.get("previsao"))

            valor_arrecadado = _sum_monthly_values(item, _MONTH_KEYS)
            valor_anulado = self._sum_anulado_monthly(item)

            valores_mensais = {
                key: _safe_decimal(item.get(key)) for key in _MONTH_KEYS
            }
            valores_anulados_mensais = {
                key: _safe_decimal(item.get(f"{_ANULADO_PREFIX}{key}"))
                for key in _MONTH_KEYS
            }

            detalhamentos.append(
                ReceitaDetalhamento(
                    ano=year,
                    detalhamento=descricao,
                    nivel=nivel,
                    ordem=ordem,
                    tipo=tipo,
                    valor_previsto=valor_previsto,
                    valor_arrecadado=valor_arrecadado,
                    valor_anulado=valor_anulado,
                    valores_mensais=valores_mensais,
                    valores_anulados_mensais=valores_anulados_mensais,
                    fonte=f"SCRAPING_{year}",
                )
            )

        logger.info(
            "parse_revenue_detailing: %d itens criados para %d",
            len(detalhamentos),
            year,
        )
        return detalhamentos

    # ------------------------------------------------------------------
    # Previsto anual por tipo (nível 1 do DetailingRevenue)
    # ------------------------------------------------------------------

    def get_previsto_anual_by_tipo(
        self,
        data: list[dict[str, Any]],
    ) -> dict[str, Decimal]:
        """Extrai valor previsto anual agrupado por tipo de receita.

        Busca itens de nível 1 (RECEITAS CORRENTES / RECEITAS DE CAPITAL)
        e retorna o campo ``previsao`` de cada um.

        Args:
            data: Lista de dicts do endpoint DetailingRevenue.

        Returns:
            Dict com chaves ``CORRENTE`` e ``CAPITAL`` mapeando ao
            previsto anual.  Tipos ausentes recebem ``Decimal("0")``.
        """
        resultado: dict[str, Decimal] = {
            "CORRENTE": Decimal("0"),
            "CAPITAL": Decimal("0"),
        }

        for item in data:
            if item.get("nivel") != 1:
                continue

            descricao = str(item.get("descricao", "")).strip().upper()
            if not descricao:
                continue

            tipo = _detect_tipo_from_descricao(descricao)
            valor = _safe_decimal(item.get("previsao"))
            resultado[tipo] = resultado[tipo] + valor

        logger.info(
            "get_previsto_anual_by_tipo: CORRENTE=%s, CAPITAL=%s",
            resultado["CORRENTE"],
            resultado["CAPITAL"],
        )
        return resultado

    # ------------------------------------------------------------------
    # Métodos internos
    # ------------------------------------------------------------------

    @staticmethod
    def _sum_anulado_monthly(item: dict[str, Any]) -> Decimal:
        """Soma os valores anulados mensais (anu_janeiro..anu_dezembro)."""
        total = Decimal("0")
        for month_key in _MONTH_KEYS:
            anulado_key = f"{_ANULADO_PREFIX}{month_key}"
            total += _safe_decimal(item.get(anulado_key))
        return total
