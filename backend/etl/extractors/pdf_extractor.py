"""
Extractor para dados financeiros de PDFs municipais.

Extrai receitas e despesas de PDFs da Prefeitura de Bandeirantes MS.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime
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


class PDFExtractor:
    """
    Extrator de dados de PDFs financeiros municipais.

    Extrai dados de receitas e despesas de PDFs gerados pelo sistema
    da Prefeitura de Bandeirantes MS.

    Attributes:
        dados_dir: Diretório raiz contendo as pastas receitas/ edespesas/

    Example:
        >>> extractor = PDFExtractor(Path("/path/to/dados"))
        >>> resultado = extractor.extract_receitas(2023)
        >>> print(f"Extraídas {len(resultado.receitas)} receitas")
    """

    # Padrões regex para parsear valores monetários brasileiros
    PATTER = {
        "valor_brasileiro": re.compile(
            r"R?\$?\s*([\d]{1,3}(\.[\d]{3})*,\d{2})", re.IGNORECASE
        ),
        "ano_arquivo": re.compile(r"(\d{4})\.pdf$", re.IGNORECASE),
        "mes_nome": re.compile(
            r"(JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|"
            r"JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)",
            re.IGNORECASE,
        ),
    }

    # Mapeamento de nomes de mesespara números
    MESES_MAP = {
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

    def __init__(self, dados_dir: Path):
        """
        Inicializa o extrator.

        Args:
            dados_dir: Diretório raiz com pastas receitas/ edespesas/
        """
        self.dados_dir = Path(dados_dir)
        self.receitas_dir = self.dados_dir / "receitas"
        self.despesas_dir = self.dados_dir / "despesas"

        # Validação dediretórios
        if not self.dados_dir.exists():
            raise FileNotFoundError(f"Diretório não encontrado: {dados_dir}")

    @staticmethod
    def parse_valor_monetario(valor_str: str) -> Decimal:
        """
        Converte string de valor monetário brasileiro para Decimal.

        Args:
            valor_str: String no formato brasileiro (ex: "R$ 1.234.567,89" ou "1234567,89").

        Returns:
            Decimal com o valor numérico.

        Raises:
            ValueError: Se não conseguir parsear o valor.

        Example:
            >>> PDFExtractor.parse_valor_monetario("R$ 1.234.567,89")
            Decimal('1234567.89')
            >>> PDFExtractor.parse_valor_monetario("5.300.388,92")
            Decimal('5300388.92')
        """
        if not valor_str:
            return Decimal("0")

        # Remove símbolos de moeda e espaços
        valor_limpo = valor_str.replace("R$", "").replace("$", "").strip()

        # Trata valores negativos
        negativo = "-" in valor_limpo
        valor_limpo = valor_limpo.replace("-", "").strip()

        # Remove pontos de milhar e substitui vírgula por ponto decimal
        valor_limpo = valor_limpo.replace(".", "").replace(",", ".")

        # Remove caracteres não numéricos exceto ponto e sinal negativo
        valor_limpo = re.sub(r"[^\d.\-]", "", valor_limpo)

        if not valor_limpo:
            return Decimal("0")

        try:
            valor = Decimal(valor_limpo)
            return -valor if negativo else valor
        except Exception as e:
            raise ValueError(
                f"Não foi possível converter '{valor_str}' para Decimal: {e}"
            )

    def extrair_ano_do_arquivo(self, arquivo: Path) -> int:
        """
        Extrai o ano do nome do arquivo.

        Args:
            arquivo: Caminho para o arquivo PDF.

        Returns:
            Ano extraído do nome.

        Raises:
            ValueError: Se não conseguir extrair o ano.
        """
        match = self.PATTER["ano_arquivo"].search(arquivo.name)
        if match:
            return int(match.group(1))
        raise ValueError(f"Não foi possível extrair o ano do arquivo: {arquivo}")

    def extrair_receitas_pdf(self, arquivo: Path) -> List[Receita]:
        """
        Extrai receitas de um arquivo PDF.

        Args:
            arquivo: Caminho para o arquivo PDF de receitas.

        Returns:
            Lista de entidades Receita extraídas.
        """
        ano = self.extrair_ano_do_arquivo(arquivo)
        receitas = []

        with pdfplumber.open(arquivo) as pdf:
            for pagina in pdf.pages:
                tabelas = pagina.extract_tables()
                if not tabelas:
                    continue

                # Processa cada tabela
                for tabela in tabelas:
                    receitas.extend(self._processar_tabela_receita(tabela, ano))

        return receitas

    def _processar_tabela_receita(
        self, tabela: List[List[str]], ano: int
    ) -> List[Receita]:
        """
        Processa uma tabela de receita e retorna lista de Receitas.

        Args:
            tabela: Tabela extraída do PDF.
            ano: Ano dos dados.

        Returns:
            Lista de receitas processadas.
        """
        receitas = []

        for linha in tabela:
            if not linha or len(linha) < 3:
                continue

            # Pular cabeçalhos e linhas de total
            primeira_coluna = str(linha[0]).strip().upper() if linha[0] else ""
            if not primeira_coluna or primeira_coluna in [
                "DETALHAMENTO",
                "MÊS",
                "TOTAL",
                "",
                "NONE",
            ]:
                continue

            # Identificar se é tabela de resumo mensal ou detalhada
            if "VALOR ARRECADADO" in str(linha).upper():
                # Tabela de resumo mensal
                receitas.extend(self._processar_linha_resumo(linha, ano))
            elif "PREVISTO" in str(linha).upper() or "ARRECADADO" in str(linha).upper():
                # Tabela detalhada de receitas
                receita = self._processar_linha_detalhada(linha, ano)
                if receita:
                    receitas.append(receita)

        return receitas

    def _processar_linha_resumo(self, linha: List[str], ano: int) -> List[Receita]:
        """
        Processa linha de resumo mensal (Mês | Valor Arrecadado).

        Args:
            linha: Linha extraída.
            ano: Ano dos dados.

        Returns:
            Lista de receitas (pode estar vazia).
        """
        receitas = []

        try:
            mes_nome = str(linha[0]).strip().upper()
            if mes_nome in self.MESES_MAP:
                mes = self.MESES_MAP[mes_nome]
                valor_arrecadado = self.parse_valor_monetario(str(linha[1]))

                # Cria uma receita genérica para o resumo mensal
                receita = Receita(
                    ano=ano,
                    mes=mes,
                    categoria="RECEITAS CORRENTES",  # Categoria padrão para resumo
                    valor_previsto=Decimal("0"),
                    valor_arrecadado=valor_arrecadado,
                    valor_anulado=Decimal("0"),
                    tipo=TipoReceita.CORRENTE,
                    fonte=f"PDF_{ano}",
                )
                receitas.append(receita)
        except Exception as e:
            # Log silencioso - linhas inválidas são normais
            pass

        return receitas

    def _processar_linha_detalhada(
        self, linha: List[str], ano: int
    ) -> Optional[Receita]:
        """
        Processa linha detalhada de receita.

        Args:
            linha: Linha extraída com colunas [Detalhamento | Previsto | Arrecadado | Anulado].
            ano: Ano dos dados.

        Returns:
            Receita se extraída com sucesso, None caso contrário.
        """
        try:
            # Formato esperado: [Categoria, Previsto, Arrecadado, Anulado]
            if len(linha) < 3:
                return None

            categoria = str(linha[0]).strip()
            valor_previsto = (
                self.parse_valor_monetario(str(linha[1]))
                if len(linha) > 1
                else Decimal("0")
            )
            valor_arrecadado = (
                self.parse_valor_monetario(str(linha[2]))
                if len(linha) > 2
                else Decimal("0")
            )
            valor_anulado = (
                self.parse_valor_monetario(str(linha[3]))
                if len(linha) > 3
                else Decimal("0")
            )

            # Validação básica
            if not categoria or categoria.upper() in ["TOTAL", ""]:
                return None

            # Determinar tipo baseado na categoria
            tipo = TipoReceita.CORRENTE
            if "CAPITAL" in categoria.upper():
                tipo = TipoReceita.CAPITAL

            # Cria receita sem mês definido (valor anual)
            # Será necessário processar todos os PDFs para esse caso
            return Receita(
                ano=ano,
                mes=1,  # Mês placeholder - será atualizado posteriormente
                categoria=categoria,
                valor_previsto=valor_previsto,
                valor_arrecadado=valor_arrecadado,
                valor_anulado=valor_anulado,
                tipo=tipo,
                fonte=f"PDF_{ano}",
            )
        except Exception as e:
            return None

    def extrair_despesas_pdf(self, arquivo: Path) -> List[Despesa]:
        """
        Extrai despesas de um arquivo PDF.

        Args:
            arquivo: Caminho para o arquivo PDF de despesas.

        Returns:
            Lista de entidades Despesa extraídas.
        """
        ano = self.extrair_ano_do_arquivo(arquivo)
        despesas = []

        with pdfplumber.open(arquivo) as pdf:
            for pagina in pdf.pages:
                tabelas = pagina.extract_tables()
                if not tabelas:
                    continue

                # Processa cada tabela
                for tabela in tabelas:
                    despesas.extend(self._processar_tabela_despesa(tabela, ano))

        return despesas

    def _processar_tabela_despesa(
        self, tabela: List[List[str]], ano: int
    ) -> List[Despesa]:
        """
        Processa uma tabela de despesa e retorna lista de Despesas.

        Args:
            tabela: Tabela extraída do PDF.
            ano: Ano dos dados.

        Returns:
            Lista de despesas processadas.
        """
        despesas = []

        for linha in tabela:
            if not linha or len(linha) < 4:
                continue

            # Pular cabeçalhos
            primeira_coluna = str(linha[0]).strip().upper() if linha[0] else ""
            if not primeira_coluna or primeira_coluna in [
                "MÊS",
                "TOTAL",
                "",
                "NONE",
                "DESCRIÇÃO",
            ]:
                continue

            # Verificar se é tabela de resumo mensal [Mês | Empenhado | Liquidado | Pago]
            if len(linha) >= 4 and primeira_coluna in self.MESES_MAP:
                despesa = self._processar_linha_resumo_despesa(linha, ano)
                if despesa:
                    despesas.append(despesa)

        return despesas

    def _processar_linha_resumo_despesa(
        self, linha: List[str], ano: int
    ) -> Optional[Despesa]:
        """
        Processa linha de resumo mensal de despesa.

        Args:
            linha: Linha com [Mês, Empenhado, Liquidado, Pago].
            ano: Ano dos dados.

        Returns:
            Despesa se extraída com sucesso, None caso contrário.
        """
        try:
            mes_nome = str(linha[0]).strip().upper()
            if mes_nome not in self.MESES_MAP:
                return None

            mes = self.MESES_MAP[mes_nome]
            valor_empenhado = self.parse_valor_monetario(str(linha[1]))
            valor_liquidado = self.parse_valor_monetario(str(linha[2]))
            valor_pago = self.parse_valor_monetario(str(linha[3]))

            return Despesa(
                ano=ano,
                mes=mes,
                valor_empenhado=valor_empenhado,
                valor_liquidado=valor_liquidado,
                valor_pago=valor_pago,
                tipo=TipoDespesa.CORRENTE,
                fonte=f"PDF_{ano}",
            )
        except Exception as e:
            return None

    def extract_receitas(
        self, ano: Optional[int] = None, anos: List[int] = None
    ) -> ResultadoExtracao:
        """
        Extrai receitas de PDFs para um ano específico ou lista de anos.

        Args:
            ano: Ano específico para extrair (opcional).
            anos: Lista de anos para extrair (opcional).

        Returns:
            ResultadoExtracao com todas as receitas extraídas.

        Example:
            >>> extractor = PDFExtractor(Path("/dados"))
            >>> resultado = extractor.extract_receitas(2023)
            >>> print(f"Extraídas {len(resultado.receitas)} receitas")
        """
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.receitas_dir)

        todas_receitas = []
        erros = []
        arquivos_processados = 0

        for a in anos_list:
            arquivo = self.receitas_dir / f"{a}.pdf"

            if not arquivo.exists():
                erros.append(f"Arquivo não encontrado: {arquivo}")
                continue

            try:
                receitas = self.extrair_receitas_pdf(arquivo)
                todas_receitas.extend(receitas)
                arquivos_processados += 1
            except Exception as e:
                erros.append(f"Erro ao extrair {arquivo}: {str(e)}")

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
        self, ano: Optional[int] = None, anos: List[int] = None
    ) -> ResultadoExtracao:
        """
        Extrai despesas de PDFs para um ano específico ou lista de anos.

        Args:
            ano: Ano específico para extrair (opcional).
            anos: Lista de anos para extrair (opcional).

        Returns:
            ResultadoExtracao com todas as despesas extraídas.
        """
        if ano:
            anos_list = [ano]
        elif anos:
            anos_list = anos
        else:
            anos_list = self._listar_anos_disponiveis(self.despesas_dir)

        todas_despesas = []
        erros = []
        arquivos_processados = 0

        for a in anos_list:
            arquivo = self.despesas_dir / f"{a}.pdf"

            if not arquivo.exists():
                erros.append(f"Arquivo não encontrado: {arquivo}")
                continue

            try:
                despesas = self.extrair_despesas_pdf(arquivo)
                todas_despesas.extend(despesas)
                arquivos_processados += 1
            except Exception as e:
                erros.append(f"Erro ao extrair {arquivo}: {str(e)}")

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
        """
        Extrai todos os dados de receitas e despesas.

        Args:
            anos_prioritarios: Lista de anos prioritários (se None, usa 2016-2026).

        Returns:
            Tupla com (resultado_receitas, resultado_despesas).
        """
        if anos_prioritarios is None:
            anos_prioritarios = list(range(2016, 2027))  # 2016-2026

        resultado_receitas = self.extract_receitas(anos=anos_prioritarios)
        resultado_despesas = self.extract_despesas(anos=anos_prioritarios)

        return resultado_receitas, resultado_despesas

    def _listar_anos_disponiveis(self, diretorio: Path) -> List[int]:
        """
        Lista anos disponíveis em um diretório de PDFs.

        Args:
            diretorio: Diretório com os arquivos PDF.

        Returns:
            Lista de anos encontrados.
        """
        anos = []
        for arquivo in diretorio.glob("*.pdf"):
            try:
                ano = self.extrair_ano_do_arquivo(arquivo)
                anos.append(ano)
            except ValueError:
                continue
        return sorted(anos)
