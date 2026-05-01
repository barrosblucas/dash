"""Modelos ORM compartilhados do banco."""
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass

class ReceitaModel(Base):
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

class DespesaModel(Base):
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

class ForecastModel(Base):
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

class MetadataETLModel(Base):
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

class ReceitaDetalhamentoModel(Base):
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
    valores_mensais = Column(
        Text,
        nullable=True,
        comment='JSON: {"janeiro": "123.45", "fevereiro": "234.56", ...}',
    )
    valores_anulados_mensais = Column(
        Text,
        nullable=True,
        comment='JSON: {"janeiro": "0", "fevereiro": "10.50", ...}',
    )
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

class ScrapingLogModel(Base):
    __tablename__ = "scraping_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data_type = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    status = Column(String(20), nullable=False)
    records_processed = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_scraping_log_type_year", "data_type", "year"),
        Index("ix_scraping_log_started", "started_at"),
    )

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    is_active = Column(Boolean, nullable=False, default=True)
    token_version = Column(Integer, nullable=False, default=0)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

class IdentityTokenModel(Base):
    __tablename__ = "identity_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_type = Column(String(32), nullable=False)
    jti = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)

    __table_args__ = (
        Index("ix_identity_tokens_user_type", "user_id", "token_type"),
        Index("ix_identity_tokens_exp", "expires_at"),
    )

class ObraModel(Base):
    __tablename__ = "obras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(32), nullable=False, unique=True, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, index=True)
    secretaria = Column(String(255), nullable=False)
    orgao = Column(String(255), nullable=False)
    contrato = Column(String(255), nullable=False)
    tipo_obra = Column(String(255), nullable=False)
    modalidade = Column(String(255), nullable=False)
    fonte_recurso = Column(String(255), nullable=False)
    data_inicio = Column(Date, nullable=False)
    previsao_termino = Column(Date, nullable=True)
    data_termino = Column(Date, nullable=True)
    logradouro = Column(String(255), nullable=False)
    bairro = Column(String(255), nullable=False)
    cep = Column(String(20), nullable=False)
    numero = Column(String(20), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    valor_orcamento = Column(Numeric(18, 2), nullable=True)
    valor_original = Column(Numeric(18, 2), nullable=True)
    valor_aditivo = Column(Numeric(18, 2), nullable=True)
    valor_homologado = Column(Numeric(18, 2), nullable=True)
    valor_contrapartida = Column(Numeric(18, 2), nullable=True)
    valor_convenio = Column(Numeric(18, 2), nullable=True)
    progresso_fisico = Column(Numeric(5, 2), nullable=True)
    progresso_financeiro = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

class ObraMedicaoModel(Base):
    __tablename__ = "obra_medicoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    obra_id = Column(
        Integer, ForeignKey("obras.id", ondelete="CASCADE"), nullable=False
    )
    sequencia = Column(Integer, nullable=False)
    mes_referencia = Column(Integer, nullable=False)
    ano_referencia = Column(Integer, nullable=False)
    valor_medicao = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    observacao = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("obra_id", "sequencia", name="uq_obra_medicao_sequencia"),
        Index("ix_obra_medicoes_periodo", "ano_referencia", "mes_referencia"),
    )

class ObraLocationModel(Base):
    __tablename__ = "obra_locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    obra_id = Column(Integer, ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    sequencia = Column(Integer, nullable=False, default=1)
    logradouro = Column(String(255), nullable=False)
    bairro = Column(String(255), nullable=False)
    cep = Column(String(20), nullable=False)
    numero = Column(String(20), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("obra_id", "sequencia", name="uq_obra_location_sequencia"),
        Index("ix_obra_locations_obra", "obra_id", "sequencia"),
    )

class ObraFundingSourceModel(Base):
    __tablename__ = "obra_funding_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    obra_id = Column(Integer, ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    sequencia = Column(Integer, nullable=False, default=1)
    nome = Column(String(255), nullable=False)
    valor = Column(Numeric(18, 2), nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("obra_id", "sequencia", name="uq_obra_funding_sequencia"),
        Index("ix_obra_funding_sources_obra", "obra_id", "sequencia"),
    )

class ObraMediaModel(Base):
    __tablename__ = "obra_media_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    obra_id = Column(Integer, ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    medicao_id = Column(Integer, ForeignKey("obra_medicoes.id", ondelete="CASCADE"), nullable=True)
    titulo = Column(String(255), nullable=True)
    media_kind = Column(String(50), nullable=False, default="image")
    source_type = Column(String(20), nullable=False, default="url")
    external_url = Column(String(1000), nullable=True)
    storage_path = Column(String(500), nullable=True)
    original_name = Column(String(255), nullable=True)
    content_type = Column(String(120), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_obra_media_assets_obra", "obra_id"),
        Index("ix_obra_media_assets_medicao", "medicao_id"),
    )

class SaudeUnidadeModel(Base):
    __tablename__ = "saude_unidades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    unit_type = Column(String(120), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    neighborhood = Column(String(120), nullable=True, index=True)
    phone = Column(String(40), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    external_id = Column(Integer, nullable=True, unique=True, index=True)
    source = Column(String(60), nullable=False, default="manual")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (Index("ix_saude_unidades_tipo_ativo", "unit_type", "is_active"),)

class SaudeUnidadeHorarioModel(Base):
    __tablename__ = "saude_unidade_horarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    unit_id = Column(
        Integer,
        ForeignKey("saude_unidades.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week = Column(String(20), nullable=False)
    opens_at = Column(Time, nullable=True)
    closes_at = Column(Time, nullable=True)
    is_closed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("unit_id", "day_of_week", name="uq_saude_unidade_horario_dia"),
        Index("ix_saude_unidade_horarios_unit", "unit_id", "day_of_week"),
    )

class SaudeSnapshotModel(Base):
    __tablename__ = "saude_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource = Column(String(80), nullable=False, index=True)
    scope_year = Column(Integer, nullable=True, index=True)
    payload_json = Column(Text, nullable=False)
    item_count = Column(Integer, nullable=False, default=0)
    source_url = Column(String(255), nullable=True)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

class SaudeSyncLogModel(Base):
    __tablename__ = "saude_sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, index=True)
    finished_at = Column(DateTime, nullable=True)
    resources_json = Column(Text, nullable=False)
    years_json = Column(Text, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)

    __table_args__ = (
        Index("ix_saude_sync_logs_started_status", "started_at", "status"),
    )

class SaudeMedicamentoModel(Base):
    __tablename__ = "saude_medicamentos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(500), nullable=False, index=True)
    unit = Column(String(100), nullable=True)
    in_stock = Column(Integer, nullable=False, default=0)
    minimum_stock = Column(Integer, nullable=True)
    department = Column(String(255), nullable=True)
    establishment = Column(String(255), nullable=True)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "product_name", "department", "establishment",
            name="uq_saude_medicamento_prod_dept_estab",
        ),
        Index("ix_saude_medicamentos_estab", "establishment"),
    )

class SaudeFarmaciaModel(Base):
    __tablename__ = "saude_farmacia"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=True, index=True)
    dataset = Column(String(50), nullable=False, index=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("ano", "mes", "dataset", "label", name="uq_saude_farmacia_row"),
        Index("ix_saude_farmacia_ano_dataset", "ano", "dataset"),
    )

class SaudeVacinacaoModel(Base):
    __tablename__ = "saude_vacinacao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=True, index=True)
    dataset = Column(String(50), nullable=False, index=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("ano", "mes", "dataset", "label", name="uq_saude_vacinacao_row"),
        Index("ix_saude_vacinacao_ano_dataset", "ano", "dataset"),
    )

class SaudeEpidemiologicoModel(Base):
    __tablename__ = "saude_epidemiologico"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset = Column(String(50), nullable=False, index=True)
    label = Column(String(500), nullable=False)
    valor = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (UniqueConstraint("dataset", "label", name="uq_saude_epidemiologico_row"),)

class SaudeAtencaoPrimariaModel(Base):
    __tablename__ = "saude_atencao_primaria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=True, index=True)
    dataset = Column(String(50), nullable=False, index=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "dataset", "label", name="uq_saude_atencao_primaria_row"
        ),
        Index("ix_saude_ap_ano_dataset", "ano", "dataset"),
    )

class SaudeBucalModel(Base):
    __tablename__ = "saude_bucal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=True, index=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (UniqueConstraint("label", name="uq_saude_bucal_label"),)

class SaudeProcedimentosModel(Base):
    __tablename__ = "saude_procedimentos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("label", name="uq_saude_procedimentos_label"),
        Index("ix_saude_procedimentos_label", "label"),
    )


from backend.shared.database.quality_models import (  # noqa: E402, F401
    DespesaBreakdownModel,
    MovimentoExtraModel,
    QualitySyncStateModel,
    QualityUnidadeGestoraModel,
)
