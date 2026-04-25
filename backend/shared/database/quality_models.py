"""Modelos ORM de qualidade/despesas do banco."""

from decimal import Decimal

from sqlalchemy import (
    Column,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from backend.shared.database.models import Base


class DespesaBreakdownModel(Base):
    __tablename__ = "despesa_breakdown"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    breakdown_type = Column(String(30), nullable=False, index=True)
    item_label = Column(String(500), nullable=False)
    valor = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="QUALITY_API")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ano", "mes", "breakdown_type", "item_label",
            name="uq_despesa_breakdown_identity",
        ),
        Index("ix_despesa_breakdown_type_ano", "breakdown_type", "ano"),
        Index("ix_despesa_breakdown_type_ano_mes", "breakdown_type", "ano", "mes"),
    )


class QualitySyncStateModel(Base):
    __tablename__ = "quality_sync_state"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_key = Column(String(80), nullable=False)
    ano = Column(Integer, nullable=False)
    payload_hash = Column(String(64), nullable=False)
    item_count = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="PENDING")
    last_checked_at = Column(DateTime, nullable=False)
    last_changed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "dataset_key", "ano", name="uq_quality_sync_state_dataset_ano",
        ),
        Index("ix_quality_sync_state_checked", "last_checked_at"),
    )


class QualityUnidadeGestoraModel(Base):
    __tablename__ = "quality_unidade_gestora"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_entidade = Column(Integer, nullable=False)
    nome_entidade = Column(String(255), nullable=False)
    tipo_entidade = Column(Integer, nullable=True)
    cnpj_entidade = Column(String(20), nullable=True)
    tipo_unidade_gestora = Column(Integer, nullable=True)
    fonte = Column(String(100), nullable=False, default="QUALITY_API")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "codigo_entidade", name="uq_quality_unidade_gestora_codigo",
        ),
    )
