"""Modelos ORM de saúde do banco."""
from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
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
from sqlalchemy.sql import func

from backend.shared.database.models import Base


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
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)
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
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)
    __table_args__ = (UniqueConstraint("label", name="uq_saude_bucal_label"),)


class SaudeProcedimentosModel(Base):
    __tablename__ = "saude_procedimentos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String(500), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    synced_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)
    __table_args__ = (
        UniqueConstraint("label", name="uq_saude_procedimentos_label"),
        Index("ix_saude_procedimentos_label", "label"),
    )
