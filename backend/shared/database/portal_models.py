"""Modelos ORM das features do portal de transparência.

Separados de quality_models.py por responsabilidade: este módulo contém
modelos que espelham dados do portal Quality (contratos, convênios, etc.)
e são populados via scrapers dedicados.
"""

from decimal import Decimal

from sqlalchemy import (
    Column,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from backend.shared.database.models import Base


class ContratoModel(Base):
    """Modelo ORM para contratos."""

    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    numero = Column(String(50), nullable=False)
    fornecedor = Column(String(500), nullable=False)
    cpf_cnpj = Column(String(20), nullable=False)
    tipo = Column(String(100), nullable=False)
    vigencia = Column(String(200), nullable=True)
    valor = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    objeto = Column(Text, nullable=True)
    processo_numero = Column(String(50), nullable=True)
    licitacao = Column(String(100), nullable=True)
    assunto = Column(String(200), nullable=True)
    qtd_aditivos = Column(Integer, nullable=True, default=0)
    valor_contratado = Column(Numeric(18, 2), nullable=True)
    valor_atualizado = Column(Numeric(18, 2), nullable=True)
    saldo_pagar = Column(Numeric(18, 2), nullable=True)
    valor_anulado = Column(Numeric(18, 2), nullable=True)
    dotacoes_orcamentarias = Column(Text, nullable=True)
    fiscais_json = Column(Text, nullable=True)  # JSON string
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "numero", name="uq_contrato_ano_numero",
        ),
        Index("ix_contrato_ano", "ano"),
        Index("ix_contrato_tipo_ano", "tipo", "ano"),
    )


class ConvenioModel(Base):
    """Modelo ORM para convênios."""

    __tablename__ = "convenios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    numero = Column(String(50), nullable=False)
    assinatura = Column(String(20), nullable=True)
    tipo = Column(String(50), nullable=False)
    esfera = Column(String(50), nullable=False)
    concedente = Column(String(500), nullable=False)
    convenente = Column(String(500), nullable=False)
    valor = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    situacao = Column(String(100), nullable=True)
    objeto = Column(Text, nullable=True)
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("ano", "numero", name="uq_convenio_ano_numero"),
        Index("ix_convenio_ano", "ano"),
        Index("ix_convenio_tipo_ano", "tipo", "ano"),
    )


class ConvenioMovimentacaoModel(Base):
    """Modelo ORM para movimentações de convênios."""

    __tablename__ = "convenio_movimentacoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    tipo = Column(String(20), nullable=False)  # "receita" ou "despesa"
    convenio = Column(String(50), nullable=False)
    lancamento = Column(String(200), nullable=True)
    entidade = Column(String(500), nullable=True)
    data = Column(String(20), nullable=True)
    concedente = Column(String(500), nullable=True)
    convenente = Column(String(500), nullable=True)
    valor = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "tipo", "convenio", "lancamento",
            name="uq_convenio_mov_identity",
        ),
        Index("ix_convenio_mov_ano_mes", "ano", "mes"),
        Index("ix_convenio_mov_tipo_ano", "tipo", "ano"),
    )


class DiariaModel(Base):
    """Modelo ORM para diárias e passagens."""

    __tablename__ = "diarias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    numero_empenho = Column(Integer, nullable=False)
    numero_liquidacao = Column(Integer, nullable=False)
    nome = Column(String(500), nullable=False)
    historico = Column(Text, nullable=True)
    destino = Column(String(200), nullable=True)
    periodo = Column(String(200), nullable=True)
    valor_total = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_devolvido = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "numero_empenho", "numero_liquidacao",
            name="uq_diaria_identity",
        ),
        Index("ix_diaria_ano_mes", "ano", "mes"),
    )


class EmendaModel(Base):
    """Modelo ORM para emendas parlamentares."""

    __tablename__ = "emendas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    emenda = Column(String(100), nullable=False)
    tipo_emenda = Column(String(200), nullable=False)
    numero_protocolo = Column(String(50), nullable=False)
    descricao = Column(Text, nullable=True)
    valor = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    detalhes_link = Column(String(1000), nullable=True)
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "emenda", "numero_protocolo",
            name="uq_emenda_identity",
        ),
        Index("ix_emenda_ano", "ano"),
        Index("ix_emenda_tipo_ano", "tipo_emenda", "ano"),
    )


class PatrimonioModel(Base):
    """Modelo ORM para controle patrimonial."""

    __tablename__ = "patrimonio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    tipo_bem = Column(String(50), nullable=False)
    descricao = Column(String(500), nullable=False)
    quantidade_anterior = Column(Integer, nullable=False, default=0)
    valor_anterior = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    quantidade_adquiridos = Column(Integer, nullable=False, default=0)
    valor_adquiridos = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    quantidade_baixados = Column(Integer, nullable=False, default=0)
    valor_baixados = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    quantidade_atual = Column(Integer, nullable=False, default=0)
    valor_atual = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "tipo_bem", "descricao", name="uq_patrimonio_identity",
        ),
        Index("ix_patrimonio_tipo_bem_ano", "tipo_bem", "ano"),
    )


class CargoModel(Base):
    """Modelo ORM para cargos e salários."""

    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False)
    cargo = Column(String(500), nullable=False)
    carga_horaria = Column(String(20), nullable=True)
    vagas_totais = Column(Integer, nullable=False, default=0)
    vagas_ocupadas = Column(Integer, nullable=False, default=0)
    salario_base = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    efetivo = Column(Integer, nullable=False, default=0)
    comissionado = Column(Integer, nullable=False, default=0)
    contratado = Column(Integer, nullable=False, default=0)
    eletivo = Column(Integer, nullable=False, default=0)
    categoria = Column(String(50), nullable=False)
    fonte = Column(String(100), nullable=False, default="QUALITY_SCRAPER")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "cargo", "categoria", name="uq_cargo_identity",
        ),
        Index("ix_cargo_ano", "ano"),
        Index("ix_cargo_ano_categoria", "ano", "categoria"),
    )


class FolhaOfficeModel(Base):
    """Modelo ORM para órgãos/departamentos da folha de pagamento."""

    __tablename__ = "folha_offices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    office_id = Column(Integer, nullable=False)
    office_description = Column(String(500), nullable=False)
    department_id = Column(Integer, nullable=False)
    department_description = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "office_id", "department_id",
            name="uq_folha_office_period",
        ),
        Index("ix_folha_offices_period", "ano", "mes"),
        Index("ix_folha_offices_office", "office_id", "ano", "mes"),
    )


class FolhaEmployeeModel(Base):
    """Modelo ORM para servidores na folha de pagamento."""

    __tablename__ = "folha_employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    office_id = Column(Integer, nullable=False)
    office_description = Column(String(500), nullable=False)
    department_id = Column(Integer, nullable=False)
    department_description = Column(String(500), nullable=False)
    contract = Column(String(50), nullable=False)
    name = Column(String(500), nullable=False)
    cpf = Column(String(20), nullable=False)
    role = Column(String(500), nullable=False)
    class_and_level = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    admission_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    base_salary = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    tenth_salary = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    vacation = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    gratification = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    others_earnings = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    discounts = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    gross_salary = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    net_salary = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    role_type_id = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "contract", "office_id", "department_id",
            name="uq_folha_employee_period",
        ),
        Index("ix_folha_employees_period", "ano", "mes"),
        Index("ix_folha_employees_office", "office_id", "ano", "mes"),
        Index("ix_folha_employees_name", "name"),
    )
