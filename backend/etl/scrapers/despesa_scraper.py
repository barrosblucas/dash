"""
Parser de despesas a partir do JSON do portal QualitySistemas.

Converte os payloads de BuscaDadosAnual e NaturezaDespesa em
entidades de domínio Despesa, tratando valores monetários em
formato brasileiro e lidando graciosamente com respostas vazias
(erro 500 da API).
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from backend.domain.entities.despesa import Despesa, TipoDespesa

logger = logging.getLogger(__name__)

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

MESES_KEYS: list[str] = [
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
]


class DespesaScraper:
    """Extrai entidades Despesa de payloads JSON do QualitySistemas.

    Métodos públicos:
        parse_despesas_annual: dados consolidados anuais (empenhado/liquidado/pago por mês)
        parse_despesas_natureza: dados por natureza (CORRENTE/CAPITAL/CONTINGENCIA por mês)
        merge_despesas: combina dados anuais e por natureza com degradação graciosa
    """

    def parse_despesas_annual(self, data: dict[str, Any], year: int) -> list[Despesa]:
        """Converte o payload de BuscaDadosAnual em entidades Despesa.

        Cada entrada mensal gera uma Despesa com tipo CORRENTE (não é possível
        determinar o tipo a partir deste endpoint isoladamente).

        Args:
            data: Payload retornado por ``fetch_despesas_annual``.
                  Pode ser vazio ``{}`` quando a API retorna erro.
            year: Ano de referência.

        Returns:
            Lista de Despesa — vazia se ``data`` for vazio ou inválido.
        """
        if not data:
            logger.info(
                "Payload anual de despesas vazio (API indisponível?) para ano %d", year
            )
            return []

        registros = self._extract_entries(data, expected_count_key="quantidadeRegistro")
        if not registros:
            logger.warning(
                "Nenhum registro mensal encontrado em payload anual para ano %d", year
            )
            return []

        despesas: list[Despesa] = []
        for registro in registros:
            despesa = self._parse_annual_entry(registro, year)
            if despesa is not None:
                despesas.append(despesa)

        logger.info(
            "Parseados %d registros anuais de despesas para %d (de %d bruto)",
            len(despesas),
            year,
            len(registros),
        )
        return despesas

    def parse_despesas_natureza(self, data: dict[str, Any], year: int) -> list[Despesa]:
        """Converte o payload de NaturezaDespesa em entidades Despesa.

        Cada combinação (natureza, mês) gera uma Despesa. Os três valores
        (empenhado, liquidado, pago) recebem o mesmo montante, pois o endpoint
        não fornece esse detalhamento — é uma estimativa conservadora.

        Args:
            data: Payload retornado por ``fetch_despesas_natureza``.
                  Pode ser vazio ``{}`` quando a API retorna erro.
            year: Ano de referência.

        Returns:
            Lista de Despesa — vazia se ``data`` for vazio ou inválido.
        """
        if not data:
            logger.info(
                "Payload de natureza de despesas vazio (API indisponível?) para ano %d",
                year,
            )
            return []

        registros = self._extract_entries(data, expected_count_key="quantidade")
        if not registros:
            logger.warning(
                "Nenhum registro de natureza encontrado em payload para ano %d", year
            )
            return []

        despesas: list[Despesa] = []
        for registro in registros:
            despesas.extend(self._parse_natureza_entry(registro, year))

        logger.info(
            "Parseados %d registros de natureza de despesas para %d",
            len(despesas),
            year,
        )
        return despesas

    def merge_despesas(
        self, annual: list[Despesa], natureza: list[Despesa]
    ) -> list[Despesa]:
        """Combina dados anuais e por natureza com degradação graciosa.

        Estratégia:
            - Se ``annual`` tem dados → usá-la (fonte canônica de empenhado/liquidado/pago)
            - Senão se ``natureza`` tem dados → usá-la como fallback degradado
            - Senão → lista vazia

        Args:
            annual: Despesas do endpoint BuscaDadosAnual.
            natureza: Despesas do endpoint NaturezaDespesa.

        Returns:
            Lista de Despesa preferindo annual, com fallback para natureza.
        """
        if annual:
            logger.info("Usando dados anuais consolidados de despesas")
            return annual

        if natureza:
            logger.warning(
                "Dados anuais indisponíveis; usando natureza de despesas como fallback degradado"
            )
            return natureza

        logger.warning("Nenhuma fonte de despesas disponível — retornando lista vazia")
        return []

    # --- Métodos privados ---

    def _extract_entries(
        self, data: dict[str, Any], expected_count_key: str
    ) -> list[dict[str, Any]]:
        """Extrai entradas numéricas do payload ("0", "1", ..., "N").

        Args:
            data: Payload completo do endpoint.
            expected_count_key: Chave que indica a quantidade esperada
                               (ex: ``"quantidadeRegistro"`` ou ``"quantidade"``).

        Returns:
            Lista de dicts com os dados de cada entrada.
        """
        entradas: list[dict[str, Any]] = []
        quantidade = data.get(expected_count_key, 0)

        for indice in range(quantidade):
            entrada = data.get(str(indice))
            if isinstance(entrada, dict):
                entradas.append(entrada)

        return entradas

    def _parse_annual_entry(
        self, registro: dict[str, Any], year: int
    ) -> Despesa | None:
        """Converte um único registro mensal do endpoint anual.

        Args:
            registro: Dict com chaves ``mes``, ``empenhado``, ``liquidado``, ``pago``.
            year: Ano de referência.

        Returns:
            Despesa ou ``None`` se o mês for inválido.
        """
        mes_raw = registro.get("mes", "")
        if not isinstance(mes_raw, str) or not mes_raw.strip():
            logger.debug("Registro sem mês válido: %s", registro)
            return None

        mes = MESES_MAP.get(mes_raw.strip().upper())
        if mes is None:
            logger.debug("Mês não reconhecido '%s' no registro: %s", mes_raw, registro)
            return None

        valor_empenhado = _parse_brazilian_currency(registro.get("empenhado"))
        valor_liquidado = _parse_brazilian_currency(registro.get("liquidado"))
        valor_pago = _parse_brazilian_currency(registro.get("pago"))

        # Skip entradas com todos os valores zerados
        if valor_empenhado == valor_liquidado == valor_pago == Decimal("0"):
            logger.debug("Registro com todos valores zerados para mês %d/%d", mes, year)
            return None

        return Despesa(
            ano=year,
            mes=mes,
            valor_empenhado=valor_empenhado,
            valor_liquidado=valor_liquidado,
            valor_pago=valor_pago,
            tipo=TipoDespesa.CORRENTE,
            fonte=f"SCRAPING_{year}",
        )

    def _parse_natureza_entry(
        self, registro: dict[str, Any], year: int
    ) -> list[Despesa]:
        """Converte um registro de natureza em múltiplas Despesa (uma por mês).

        Args:
            registro: Dict com ``descricao`` e valores mensais.
            year: Ano de referência.

        Returns:
            Lista de Despesa, uma por mês com valor não-vazio.
        """
        descricao = registro.get("descricao", "")
        if not isinstance(descricao, str) or not descricao.strip():
            logger.debug("Registro de natureza sem descrição: %s", registro)
            return []

        descricao = descricao.strip()
        tipo = _classificar_tipo_despesa(descricao)

        despesas: list[Despesa] = []
        for mes_key, mes_num in zip(MESES_KEYS, range(1, 13), strict=False):
            valor_bruto = registro.get(mes_key)
            valor = _parse_brazilian_currency(valor_bruto)

            if valor == Decimal("0"):
                continue

            despesas.append(
                Despesa(
                    ano=year,
                    mes=mes_num,
                    valor_empenhado=valor,
                    valor_liquidado=valor,
                    valor_pago=valor,
                    categoria=descricao,
                    tipo=tipo,
                    fonte=f"SCRAPING_{year}",
                )
            )

        return despesas


def _parse_brazilian_currency(value: str | float | None) -> Decimal:
    """Converte valor monetário brasileiro para Decimal.

    Formatos aceitos:
        - "1.234.567,89" → Decimal("1234567.89")
        - "500,00" → Decimal("500.00")
        - "-1.000,50" → Decimal("-1000.50")
        - 1234.56 (float) → Decimal("1234.56")
        - None / "" / " " → Decimal("0")

    Args:
        value: Valor em formato brasileiro, numérico, ou ausente.

    Returns:
        Decimal correspondente, ou ``Decimal("0")`` para valores vazios.
    """
    if value is None:
        return Decimal("0")

    if isinstance(value, int | float):
        return Decimal(str(value))

    if not isinstance(value, str) or not value.strip():
        return Decimal("0")

    valor_limpo = value.strip()

    # Detectar sinal negativo
    negativo = valor_limpo.startswith("-")
    if negativo:
        valor_limpo = valor_limpo[1:].strip()

    # Remover separador de milhar (.) e trocar decimal (,) por (.)
    valor_limpo = valor_limpo.replace(".", "").replace(",", ".")

    if not valor_limpo or valor_limpo == ".":
        return Decimal("0")

    try:
        resultado = Decimal(valor_limpo)
    except Exception:
        logger.debug("Falha ao parsear valor monetário '%s'", value)
        return Decimal("0")

    return -resultado if negativo else resultado


def _classificar_tipo_despesa(descricao: str) -> TipoDespesa:
    """Classifica a natureza da despesa pela descrição.

    Args:
        descricao: Texto da natureza (ex: "DESPESAS CORRENTES").

    Returns:
        TipoDespesa correspondente, padrão CORRENTE.
    """
    descricao_upper = descricao.upper()

    if "CONTINGENCIA" in descricao_upper or "CONTINGÊNCIA" in descricao_upper:
        return TipoDespesa.CONTINGENCIA

    if "CAPITAL" in descricao_upper:
        return TipoDespesa.CAPITAL

    # Padrão: qualquer outra descrição (incluindo "DESPESAS CORRENTES")
    return TipoDespesa.CORRENTE
