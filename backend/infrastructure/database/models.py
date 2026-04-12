"""
Modelos SQLAlchemy para o banco de dados.

Define as tabelas e relacionamentos do schema do SQLite.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class ReceitaModel(Base):
    """
    Modelo SQLAlchemy para a tabela de receitas.

    Armazena dados de receitas municipais com valores previstos e arrecadados.

    Attributes:
        id: Chave primária auto-incremento
        ano: Ano da receita
        mes: Mês da receita (1-12)
        categoria: Categoria da receita
        subcategoria: Subcategoria da receita
        tipo: Tipo da receita (CORRENTE ou CAPITAL)
        valor_previsto: Valor previsto no orçamento
        valor_arrecadado: Valor efetivamente arrecadado
        valor_anulado: Valor anulado/estornado
        fonte: Fonte dos dados
        created_at: Data de criação
        updated_at: Data da última atualização
    """

    __tablename__ = "receitas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    categoria = Column(String(500), nullable=False, index=True)
    subcategoria = Column(String(500), nullable=True)
    tipo = Column(String(50), nullable=False, default="CORRENTE")
    valor_previsto = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_arrecadado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_anulado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="PDF")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "categoria", name="uq_receita_periodo_categoria"
        ),
        Index("ix_receita_ano_mes", "ano", "mes"),
        Index("ix_receita_categoria_ano", "categoria", "ano"),
    )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"<ReceitaModel(id={self.id}, ano={self.ano}, mes={self.mes}, "
            f"categoria='{self.categoria[:30]}...')>"
        )


class DespesaModel(Base):
    """
    Modelo SQLAlchemy para a tabela de despesas.

    Armazena dados de despesas municipais com valores empenhados, liquidados e pagos.

    Attributes:
        id: Chave primária auto-incremento
        ano: Ano da despesa
        mes: Mês da despesa (1-12)
        categoria: Categoria da despesa
        subcategoria: Subcategoria da despesa
        tipo: Tipo da despesa (CORRENTE, CAPITAL ou CONTINGENCIA)
        valor_empenhado: Valor empenhado
        valor_liquidado: Valor liquidado
        valor_pago: Valor pago
        fonte: Fonte dos dados
        created_at: Data de criação
        updated_at: Data da última atualização
    """

    __tablename__ = "despesas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    categoria = Column(String(500), nullable=True, index=True)
    subcategoria = Column(String(500), nullable=True)
    tipo = Column(String(50), nullable=False, default="CORRENTE")
    valor_empenhado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_liquidado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_pago = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="PDF")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_despesa_ano_mes", "ano", "mes"),
        Index("ix_despesa_categoria_ano", "categoria", "ano"),
        Index("ix_despesa_tipo_periodo", "tipo", "ano", "mes"),
    )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"<DespesaModel(id={self.id}, ano={self.ano}, mes={self.mes}, "
            f"valor_empenhado={self.valor_empenhado})>"
        )


class ForecastModel(Base):
    """
    Modelo SQLAlchemy para previsões de receitas/despesas.

    Armazena previsões geradas por modelos de Machine Learning.

    Attributes:
        id: Chave primária auto-incremento
        tipo: Tipo de previsão (RECEITA ou DESPESA)
        categoria: Categoria prevista
        data_prevista: Data da previsão
        yhat: Valor previsto
        yhat_lower: Limite inferior do intervalo de confiança
        yhat_upper: Limite superior do intervalo de confiança
        modelo: Nome do modelo utilizado
        created_at: Data de criação
    """

    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(50), nullable=False, index=True)
    categoria = Column(String(500), nullable=True, index=True)
    data_prevista = Column(Date, nullable=False, index=True)
    yhat = Column(Numeric(18, 2), nullable=False)
    yhat_lower = Column(Numeric(18, 2), nullable=True)
    yhat_upper = Column(Numeric(18, 2), nullable=True)
    modelo = Column(String(100), nullable=True, default="prophet")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)

    __table_args__ = (
        Index("ix_forecast_tipo_data", "tipo", "data_prevista"),
        UniqueConstraint(
            "tipo", "categoria", "data_prevista", name="uq_forecast_unique"
        ),
    )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"<ForecastModel(id={self.id}, tipo='{self.tipo}', "
            f"data={self.data_prevista}, yhat={self.yhat})>"
        )


class MetadataETLModel(Base):
    """
    Modelo SQLAlchemy para metadados do processo ETL.

    Rastreia execuções do pipeline de extração de dados.

    Attributes:
        id: Chave primária auto-incremento
        arquivo: Nome do arquivo processado
        tipo: Tipo de dado (RECEITA ou DESPESA)
        ano: Ano dos dados
        status: Status do processamento (SUCESSO, ERRO, PARCIAL)
        registros_processados: Quantidade de registros processados
        mensagem: Mensagem de erro ou detalhes
        processed_at: Data e hora do processamento
    """

    __tablename__ = "metadata_etl"

    id = Column(Integer, primary_key=True, autoincrement=True)
    arquivo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=False)
    ano = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    registros_processados = Column(Integer, default=0)
    mensagem = Column(Text, nullable=True)
    processed_at = Column(DateTime, default=func.current_timestamp(), nullable=False)

    __table_args__ = (
        Index("ix_etl_arquivo", "arquivo"),
        Index("ix_etl_tipo_ano", "tipo", "ano"),
    )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"<MetadataETLModel(id={self.id}, arquivo='{self.arquivo}', "
            f"status='{self.status}', registros={self.registros_processados})>"
        )


class ReceitaDetalhamentoModel(Base):
    """
    Modelo SQLAlchemy para detalhamento hierárquico de receitas.

    Armazena o detalhamento completo extraído dos PDFs com nível de hierarquia.

    Attributes:
        id: Chave primária
        ano: Ano de referência
        detalhamento: Nome da categoria (ex: "IMPOSTOS SOBRE O PATRIMÔNIO")
        nivel: Nível na hierarquia (1=RECEITAS CORRENTES, 2=subcategoria, etc.)
        ordem: Ordem de apresentação no PDF original
        tipo: "CORRENTE" ou "CAPITAL"
        valor_previsto: Valor previsto anual
        valor_arrecadado: Valor arrecadado anual
        valor_anulado: Valor anulado anual
        fonte: Fonte dos dados
        created_at: Data de criação
        updated_at: Data de atualização
    """

    __tablename__ = "receita_detalhamento"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    detalhamento = Column(String(500), nullable=False)
    nivel = Column(Integer, nullable=False, default=1)
    ordem = Column(Integer, nullable=False, default=0)
    tipo = Column(String(50), nullable=False, default="CORRENTE")
    valor_previsto = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_arrecadado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_anulado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="PDF")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_detalhamento_ano_nivel", "ano", "nivel"),
        Index("ix_detalhamento_ano_ordem", "ano", "ordem"),
        UniqueConstraint(
            "ano", "detalhamento", "ordem", name="uq_detalhamento_ano_cat_ordem"
        ),
    )

    def __repr__(self) -> str:
        """Representação para debug."""
        return (
            f"<ReceitaDetalhamentoModel(id={self.id}, ano={self.ano}, "
            f"nivel={self.nivel}, detalhamento='{self.detalhamento[:30]}...')>"
        )
