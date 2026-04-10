"""
Extractor para dados financeiros de PDFs municipais.

Extrai receitas e despesas de PDFs da Prefeitura de Bandeirantes MS.
Captura totais mensais, previstos anuais e breakdown por categoria.
"""

import re
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from enum import Enum

import pdfplumber

from backend.domain.entities.receita import Receita, TipoReceita
from backend.domain.entities.despesa import Despesa, TipoDespesa


class TipoDocumento(str, Enum):
    """Tipo de documento PDF."""

    RECEITA = "RECEITA"
    DESPESA = "DESPESA"


@dataclass
class ResultadoExtracao:
    """Resultado da extração de um PDF."""

    sucesso: bool
    arquivo: str
    tipo: TipoDocumento
    ano: int
    receitas: List[Receita] = field(default_factory=list)
    despesas: List[Despesa] = field(default_factory=list)
    erro: Optional[str] = None
    registros_processados: int = 0

    def __str__(self) -> str:
        """Representação em string do resultado."""
        status = "SUCESSO" if self.sucesso else "ERRO"
        return (
            f"ResultadoExtracao({self.arquivo} - {status} - "
            f"{self.registros_processados} registros)"
        )


# Mapeamento de nomes de meses para números
MESES_MAP: Dict[str, int] = {
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

# Mapeamento de nomes de meses abreviados (usados nas tabelas de despesas)
MESES_ABREV_MAP: Dict[str, int] = {
    "JANEIRO": 1,
    "FEVEREIRO": 2,
    "MARÇO": 3,
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

# Cabeçalhos a ignorar no processamento de tabelas
SKIP_HEADERS = {
    "DETALHAMENTO",
    "MÊS",
    "MES",
    "TOTAL",
    "",
    "NONE",
    "DESCRIÇÃO",
    "DESCRICAO",
    "VALOR ARRECADADO",
}


def parse_valor_monetario(valor_str: str) -> Decimal:
    """
    Converte string de valor monetário brasileiro para Decimal.

    Args:
        valor_str: String no formato brasileiro (ex: "R$ 1.234.567,89").

    Returns:
        Decimal com o valor numérico.
    """
    if not valor_str:
        return Decimal("0")

    valor_limpo = valor_str.replace("R$", "").replace("$", "").strip()

    negativo = "-" in valor_limpo
    valor_limpo = valor_limpo.replace("-", "").strip()

    valor_limpo = valor_limpo.replace(".", "").replace(",", ".")

    valor_limpo = re.sub(r"[^\d.\-]", "", valor_limpo)

    if not valor_limpo:
        return Decimal("0")

    try:
        valor = Decimal(valor_limpo)
        return -valor if negativo else valor
    except Exception:
        return Decimal("0")


def extrair_ano_do_arquivo(arquivo: Path) -> int:
    """Extrai o ano do nome do arquivo (ex: 2025.pdf -> 2025)."""
    match = re.search(r"(\d{4})\.pdf$", arquivo.name, re.IGNORECASE)
    if match:
        return int(match.group(1))
    raise ValueError(f"Não foi possível extrair o ano do arquivo: {arquivo}")


class PDFExtractor:
    """
    Extrator de dados de PDFs financeiros municipais.

    Extrai dados de receitas e despesas dos relatórios consolidados
    da Prefeitura de Bandeirantes MS.

    Attributes:
        dados_dir: Diretório raiz contendo as pastas receitas/ e despesas/
    """

    def __init__(self, dados_dir: Path):
        self.dados_dir = Path(dados_dir)
        self.receitas_dir = self.dados_dir / "receitas"
        self.despesas_dir = self.dados_dir / "despesas"

        if not self.dados_dir.exists():
            raise FileNotFoundError(f"Diretório não encontrado: {dados_dir}")

    # ------------------------------------------------------------------
    # RECEITAS
    # ------------------------------------------------------------------

    def extrair_receitas_pdf(self, arquivo: Path) -> List[Receita]:
        """
        Extrai receitas de um arquivo PDF.

        O PDF de receitas contém:
        - Tabela 1: Resumo mensal (Mês | Valor Arrecadado)
        - Tabela 2+: Detalhamento (Detalhamento | Previsto (Anual) | Arrecadado | Anulado)

        Estratégia:
        1. Extrair valores arrecadados mensais da Tabela 1
        2. Extrair previsto anual da linha "RECEITAS CORRENTES" da Tabela 2
        3. Distribuir o previsto anual igualmente entre os meses com dados
        """
        ano = extrair_ano_do_arquivo(arquivo)
        receitas: List[Receita] = []

        # Dados mensais de arrecadação (Tabela 1)
        arrecadado_mensal: Dict[int, Decimal] = {}

        # Previsto anual da categoria principal
        previsto_anual_correntes = Decimal("0")
        previsto_anual_capital = Decimal("0")

        with pdfplumber.open(arquivo) as pdf:
            for pagina in pdf.pages:
                tabelas = pagina.extract_tables()
                if not tabelas:
                    continue

                for tabela in tabelas:
                    if not tabela or len(tabela) < 2:
                        continue

                    header = [str(c).strip().upper() if c else "" for c in tabela[0]]

                    # Tabela de resumo mensal: ["Mês", "Valor Arrecadado"]
                    if _is_summary_table(header):
                        for linha in tabela[1:]:
                            mes, valor = _parse_summary_row(linha)
                            if mes is not None and valor is not None:
                                arrecadado_mensal[mes] = valor

                    # Tabela detalhada: ["Detalhamento", "Previsto (Anual)", ...]
                    elif _is_detail_table(header):
                        for linha in tabela[1:]:
                            cat, previsto, arrec, anulado = _parse_detail_row(linha)
                            if cat is None:
                                continue

                            cat_upper = cat.upper().strip().rstrip(".")
                            if cat_upper in ("RECEITAS CORRENTES", "RECEITA CORRENTE"):
                                previsto_anual_correntes = previsto
                            elif cat_upper in (
                                "RECEITAS DE CAPITAL",
                                "RECEITA DE CAPITAL",
                            ):
                                previsto_anual_capital = previsto

        # Montar registros mensais com previsto distribuído
        meses_com_dados = sorted(arrecadado_mensal.keys())
        if not meses_com_dados:
            return receitas

        total_previsto = previsto_anual_correntes + previsto_anual_capital
        num_meses = len(meses_com_dados)
        previsto_por_mes = total_previsto / num_meses if num_meses > 0 else Decimal("0")

        for mes in meses_com_dados:
            arrecadado = arrecadado_mensal[mes]
            receitas.append(
                Receita(
                    ano=ano,
                    mes=mes,
                    categoria="RECEITAS CORRENTES",
                    valor_previsto=previsto_por_mes,
                    valor_arrecadado=arrecadado,
                    valor_anulado=Decimal("0"),
                    tipo=TipoReceita.CORRENTE,
                    fonte=f"PDF_{ano}",
                )
            )

        return receitas

    # ------------------------------------------------------------------
    # DESPESAS
    # ------------------------------------------------------------------

    def extrair_despesas_pdf(self, arquivo: Path) -> List[Despesa]:
        """
        Extrai despesas de um arquivo PDF.

        O PDF de despesas contém:
        - Tabela 2: Resumo mensal (Mês | Empenhado | Liquidado | Pago)
        - Tabelas 3-4: Breakdown por tipo (Descrição | Meses)

        Estratégia:
        1. Extrair totais mensais (empenhado, liquidado, pago) da Tabela resumo
        2. Extrair breakdown EMPENHADO por tipo das tabelas de descrição
        3. Para cada tipo, ratear liquidado e pago proporcionalmente ao empenhado
           apenas quando o breakdown for consistente (sem conflitos de sinal)
        4. Em caso de inconsistência, usar os valores totais com tipo CORRENTE
        """
        ano = extrair_ano_do_arquivo(arquivo)
        despesas: List[Despesa] = []

        # Totais mensais: {mes: {empenhado, liquidado, pago}}
        totais_mensais: Dict[int, Dict[str, Decimal]] = {}

        # Breakdown empenhado por tipo e mês
        breakdown_emp: Dict[Tuple[str, int], Decimal] = {}

        with pdfplumber.open(arquivo) as pdf:
            for pagina in pdf.pages:
                tabelas = pagina.extract_tables()
                if not tabelas:
                    continue

                for tabela in tabelas:
                    if not tabela or len(tabela) < 2:
                        continue

                    header = [str(c).strip().upper() if c else "" for c in tabela[0]]

                    if _is_expense_summary_table(header):
                        for linha in tabela[1:]:
                            resultado = _parse_expense_summary_row(linha)
                            if resultado:
                                mes, emp, liq, pago = resultado
                                totais_mensais[mes] = {
                                    "empenhado": emp,
                                    "liquidado": liq,
                                    "pago": pago,
                                }

                    elif _is_expense_breakdown_table(header):
                        meses_cols = _parse_breakdown_header(header)
                        for linha in tabela[1:]:
                            _parse_breakdown_row(linha, meses_cols, breakdown_emp)

        # Montar registros
        if breakdown_emp:
            despesas = self._montar_despesas_com_breakdown(
                ano, totais_mensais, breakdown_emp
            )
        else:
            for mes, valores in sorted(totais_mensais.items()):
                despesas.append(
                    Despesa(
                        ano=ano,
                        mes=mes,
                        valor_empenhado=valores["empenhado"],
                        valor_liquidado=valores["liquidado"],
                        valor_pago=valores["pago"],
                        tipo=TipoDespesa.CORRENTE,
                        fonte=f"PDF_{ano}",
                    )
                )

        return despesas

    def _montar_despesas_com_breakdown(
        self,
        ano: int,
        totais_mensais: Dict[int, Dict[str, Decimal]],
        breakdown_emp: Dict[Tuple[str, int], Decimal],
    ) -> List[Despesa]:
        """
        Monta registros de despesa com breakdown por tipo.

        Estratégia robusta: para cada mês, verificar se o breakdown
        é consistente com o total. Se não for, usar valor total como CORRENTE.
        """
        despesas: List[Despesa] = []

        # Tipos encontrados
        tipos_map: Dict[str, TipoDespesa] = {}
        for tipo_str, _ in breakdown_emp.keys():
            tipo_upper = tipo_str.upper()
            if "CAPITAL" in tipo_upper:
                tipos_map[tipo_str] = TipoDespesa.CAPITAL
            elif "CONTINGENCIA" in tipo_upper or "CONTINGÊNCIA" in tipo_upper:
                tipos_map[tipo_str] = TipoDespesa.CONTINGENCIA
            else:
                tipos_map[tipo_str] = TipoDespesa.CORRENTE

        for mes in sorted(totais_mensais.keys()):
            total_mes = totais_mensais[mes]
            total_emp = total_mes["empenhado"]
            total_liq = total_mes["liquidado"]
            total_pago = total_mes["pago"]

            # Soma empenhado dos tipos para este mês
            emp_por_tipo = {
                ts: breakdown_emp.get((ts, mes), Decimal("0")) for ts in tipos_map
            }
            soma_emp = sum(emp_por_tipo.values())

            # Verificar consistência: a soma do breakdown deve ser ≈ total empenhado
            # Tolerância de 1 real para arredondamentos
            tolerancia = Decimal("1")
            if abs(soma_emp - total_emp) > tolerancia:
                # Inconsistente: registrar total como CORRENTE
                despesas.append(
                    Despesa(
                        ano=ano,
                        mes=mes,
                        valor_empenhado=total_emp,
                        valor_liquidado=total_liq,
                        valor_pago=total_pago,
                        tipo=TipoDespesa.CORRENTE,
                        fonte=f"PDF_{ano}",
                    )
                )
                continue

            # Consistente: ratear liquidado e pago proporcionalmente
            for tipo_str, tipo_enum in tipos_map.items():
                emp_tipo = emp_por_tipo[tipo_str]

                # Pular tipos com zero (exceto CONTINGENCIA que pode ser zero)
                if emp_tipo == Decimal("0") and tipo_enum != TipoDespesa.CONTINGENCIA:
                    continue

                if total_emp == Decimal("0"):
                    liq_tipo = Decimal("0")
                    pago_tipo = Decimal("0")
                else:
                    proporcao = emp_tipo / total_emp
                    liq_tipo = (total_liq * proporcao).quantize(Decimal("0.01"))
                    pago_tipo = (total_pago * proporcao).quantize(Decimal("0.01"))

                despesas.append(
                    Despesa(
                        ano=ano,
                        mes=mes,
                        valor_empenhado=emp_tipo,
                        valor_liquidado=liq_tipo,
                        valor_pago=pago_tipo,
                        tipo=tipo_enum,
                        fonte=f"PDF_{ano}",
                    )
                )

        return despesas

    # ------------------------------------------------------------------
    # Métodos de extração em lote
    # ------------------------------------------------------------------

    def extract_receitas(
        self, ano: Optional[int] = None, anos: Optional[List[int]] = None
    ) -> ResultadoExtracao:
        """Extrai receitas de PDFs para um ano ou lista de anos."""
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.receitas_dir)

        todas_receitas: List[Receita] = []
        erros: List[str] = []

        for a in anos_list:
            arquivo = self.receitas_dir / f"{a}.pdf"
            if not arquivo.exists():
                erros.append(f"Arquivo não encontrado: {arquivo}")
                continue
            try:
                receitas = self.extrair_receitas_pdf(arquivo)
                todas_receitas.extend(receitas)
            except Exception as e:
                erros.append(f"Erro ao extrair {arquivo}: {e}")

        return ResultadoExtracao(
            sucesso=len(erros) == 0,
            arquivo=f"receitas_{anos_list}",
            tipo=TipoDocumento.RECEITA,
            ano=ano or 0,
            receitas=todas_receitas,
            erro="; ".join(erros) if erros else None,
            registros_processados=len(todas_receitas),
        )

    def extract_despesas(
        self, ano: Optional[int] = None, anos: Optional[List[int]] = None
    ) -> ResultadoExtracao:
        """Extrai despesas de PDFs para um ano ou lista de anos."""
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.despesas_dir)

        todas_despesas: List[Despesa] = []
        erros: List[str] = []

        for a in anos_list:
            arquivo = self.despesas_dir / f"{a}.pdf"
            if not arquivo.exists():
                erros.append(f"Arquivo não encontrado: {arquivo}")
                continue
            try:
                despesas = self.extrair_despesas_pdf(arquivo)
                todas_despesas.extend(despesas)
            except Exception as e:
                erros.append(f"Erro ao extrair {arquivo}: {e}")

        return ResultadoExtracao(
            sucesso=len(erros) == 0,
            arquivo=f"despesas_{anos_list}",
            tipo=TipoDocumento.DESPESA,
            ano=ano or 0,
            despesas=todas_despesas,
            erro="; ".join(erros) if erros else None,
            registros_processados=len(todas_despesas),
        )

    def extract_todos(
        self, anos_prioritarios: Optional[List[int]] = None
    ) -> Tuple[ResultadoExtracao, ResultadoExtracao]:
        """Extrai todos os dados de receitas e despesas."""
        if anos_prioritarios is None:
            anos_prioritarios = list(range(2013, 2027))

        resultado_receitas = self.extract_receitas(anos=anos_prioritarios)
        resultado_despesas = self.extract_despesas(anos=anos_prioritarios)

        return resultado_receitas, resultado_despesas

    def _listar_anos_disponiveis(self, diretorio: Path) -> List[int]:
        """Lista anos disponíveis em um diretório de PDFs."""
        anos: List[int] = []
        for arquivo in diretorio.glob("*.pdf"):
            try:
                anos.append(extrair_ano_do_arquivo(arquivo))
            except ValueError:
                continue
        return sorted(anos)


# ======================================================================
# Funções auxiliares de parsing (module-level para clareza)
# ======================================================================


def _is_summary_table(header: List[str]) -> bool:
    """Verifica se é tabela de resumo mensal (Mês | Valor Arrecadado)."""
    if len(header) < 2:
        return False
    h0 = header[0].strip().upper()
    return h0 in ("MÊS", "MES", "MÊS/ANO") or (
        "VALOR ARRECADADO" in " ".join(header).upper() and h0 not in SKIP_HEADERS
    )


def _is_detail_table(header: List[str]) -> bool:
    """Verifica se é tabela detalhada com Previsto (Anual)."""
    header_str = " ".join(header).upper()
    return "PREVISTO" in header_str and "DETALHAMENTO" in header_str


def _parse_summary_row(
    linha: List[Optional[str]],
) -> Tuple[Optional[int], Optional[Decimal]]:
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
    linha: List[Optional[str]],
) -> Tuple[Optional[str], Optional[Decimal], Optional[Decimal], Optional[Decimal]]:
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


def _is_expense_summary_table(header: List[str]) -> bool:
    """Verifica se é tabela de resumo mensal de despesas."""
    if len(header) < 4:
        return False
    h0 = header[0].strip().upper()
    h_rest = " ".join(header[1:]).upper()
    return h0 in ("MÊS", "MES") and "EMPENHADO" in h_rest


def _parse_expense_summary_row(
    linha: List[Optional[str]],
) -> Optional[Tuple[int, Decimal, Decimal, Decimal]]:
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


def _is_expense_breakdown_table(header: List[str]) -> bool:
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


def _parse_breakdown_header(header: List[str]) -> Dict[int, int]:
    """
    Parseia header de tabela de breakdown.

    Returns:
        Dict mapeando índice da coluna -> número do mês
    """
    meses_cols: Dict[int, int] = {}
    for idx, h in enumerate(header[1:], start=1):
        h_clean = str(h).strip().upper()
        if h_clean in MESES_ABREV_MAP:
            meses_cols[idx] = MESES_ABREV_MAP[h_clean]
    return meses_cols


def _parse_breakdown_row(
    linha: List[Optional[str]],
    meses_cols: Dict[int, int],
    breakdown: Dict[Tuple[str, int], Decimal],
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
