"""Extrator principal de dados de PDFs financeiros municipais."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pdfplumber

from backend.features.despesa.despesa_types import Despesa, TipoDespesa
from backend.features.receita.receita_types import Receita, TipoReceita
from backend.shared.pdf_parsers import (
    _detect_tipo_from_header,
    _detectar_nivel,
    _is_detail_table,
    _is_expense_breakdown_table,
    _is_expense_summary_table,
    _is_summary_table,
    _parse_breakdown_header,
    _parse_breakdown_row,
    _parse_detail_row,
    _parse_detail_text_line,
    _parse_expense_summary_row,
    _parse_summary_row,
)
from backend.shared.pdf_types import (
    ReceitaDetalhamento,
    ResultadoExtracao,
    TipoDocumento,
    extrair_ano_do_arquivo,
)


class PDFExtractor:
    """Extrator de dados de PDFs financeiros municipais."""

    def __init__(self, dados_dir: Path):
        self.dados_dir = Path(dados_dir)
        self.receitas_dir = self.dados_dir / "receitas"
        self.despesas_dir = self.dados_dir / "despesas"
        if not self.dados_dir.exists():
            raise FileNotFoundError(f"Diretório não encontrado: {dados_dir}")

    # -- RECEITAS --

    def extrair_receitas_pdf(self, arquivo: Path) -> list[Receita]:
        """Extrai receitas de um arquivo PDF."""
        ano = extrair_ano_do_arquivo(arquivo)
        receitas: list[Receita] = []
        arrecadado_mensal: dict[int, Decimal] = {}
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
                    if _is_summary_table(header):
                        for linha in tabela[1:]:
                            mes, valor = _parse_summary_row(linha)
                            if mes is not None and valor is not None:
                                arrecadado_mensal[mes] = valor
                    elif _is_detail_table(header):
                        for linha in tabela[1:]:
                            cat, previsto, arrec, _ = _parse_detail_row(linha)
                            if cat is None:
                                continue
                            cat_upper = cat.upper().strip().rstrip(".")
                            if cat_upper in ("RECEITAS CORRENTES", "RECEITA CORRENTE"):
                                previsto_anual_correntes = previsto
                            elif cat_upper in ("RECEITAS DE CAPITAL", "RECEITA DE CAPITAL"):
                                previsto_anual_capital = previsto

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

    # -- DESPESAS --

    def extrair_despesas_pdf(self, arquivo: Path) -> list[Despesa]:
        """Extrai despesas de um arquivo PDF."""
        ano = extrair_ano_do_arquivo(arquivo)
        despesas: list[Despesa] = []
        totais_mensais: dict[int, dict[str, Decimal]] = {}
        breakdown_emp: dict[tuple[str, int], Decimal] = {}

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
        totais_mensais: dict[int, dict[str, Decimal]],
        breakdown_emp: dict[tuple[str, int], Decimal],
    ) -> list[Despesa]:
        """Monta registros de despesa com breakdown por tipo."""
        despesas: list[Despesa] = []
        tipos_map: dict[str, TipoDespesa] = {}
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
            emp_por_tipo = {
                ts: breakdown_emp.get((ts, mes), Decimal("0")) for ts in tipos_map
            }
            soma_emp = sum(emp_por_tipo.values())
            tolerancia = Decimal("1")
            if abs(soma_emp - total_emp) > tolerancia:
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
            for tipo_str, tipo_enum in tipos_map.items():
                emp_tipo = emp_por_tipo[tipo_str]
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

    # -- DETALHAMENTO HIERÁRQUICO --

    def extrair_detalhamento_pdf(self, arquivo: Path) -> list[ReceitaDetalhamento]:
        """Extrai o detalhamento hierárquico completo de um PDF de receitas."""
        ano = extrair_ano_do_arquivo(arquivo)
        itens: list[ReceitaDetalhamento] = []

        with pdfplumber.open(arquivo) as pdf:
            in_detail_section = False
            ordem = 0
            current_tipo = "CORRENTE"
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if not text:
                    continue
                for line in text.split("\n"):
                    stripped = line.strip()
                    if stripped.upper().startswith("DETALHAMENTO") and "PREVISTO" in stripped.upper():
                        in_detail_section = True
                        continue
                    if not in_detail_section:
                        continue
                    if not stripped:
                        continue
                    if stripped.upper().startswith("TOTAL") and "GERAL" in stripped.upper():
                        break
                    leading_spaces = len(line) - len(line.lstrip(" "))
                    nivel = _detectar_nivel(leading_spaces)
                    nome, valores = _parse_detail_text_line(stripped)
                    if nome is None:
                        continue
                    if nivel == 1:
                        current_tipo = _detect_tipo_from_header(nome)
                    tipo = "CORRENTE" if nome.upper().startswith("(-)") else current_tipo
                    ordem += 1
                    itens.append(
                        ReceitaDetalhamento(
                            ano=ano,
                            detalhamento=nome,
                            nivel=nivel,
                            ordem=ordem,
                            tipo=tipo,
                            valor_previsto=valores[0],
                            valor_arrecadado=valores[1],
                            valor_anulado=valores[2],
                            fonte=f"PDF_{ano}",
                        )
                    )
        return itens

    # -- EXTRAÇÃO EM LOTE --

    def extract_receitas(
        self, ano: int | None = None, anos: list[int] | None = None
    ) -> ResultadoExtracao:
        """Extrai receitas de PDFs para um ano ou lista de anos."""
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.receitas_dir)
        todas_receitas: list[Receita] = []
        erros: list[str] = []
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
        self, ano: int | None = None, anos: list[int] | None = None
    ) -> ResultadoExtracao:
        """Extrai despesas de PDFs para um ano ou lista de anos."""
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.despesas_dir)
        todas_despesas: list[Despesa] = []
        erros: list[str] = []
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
        self, anos_prioritarios: list[int] | None = None
    ) -> tuple[ResultadoExtracao, ResultadoExtracao]:
        """Extrai todos os dados de receitas e despesas."""
        if anos_prioritarios is None:
            anos_prioritarios = list(range(2013, 2027))
        resultado_receitas = self.extract_receitas(anos=anos_prioritarios)
        resultado_despesas = self.extract_despesas(anos=anos_prioritarios)
        return resultado_receitas, resultado_despesas

    def _listar_anos_disponiveis(self, diretorio: Path) -> list[int]:
        """Lista anos disponíveis em um diretório de PDFs."""
        anos: list[int] = []
        for arquivo in diretorio.glob("*.pdf"):
            try:
                anos.append(extrair_ano_do_arquivo(arquivo))
            except ValueError:
                continue
        return sorted(anos)
