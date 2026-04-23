"""add saude transparente v1

Revision ID: 7b6610d4f1c2
Revises: f9d741c1a962
Create Date: 2026-04-23 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7b6610d4f1c2"
down_revision: str | None = "f9d741c1a962"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saude_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource", sa.String(length=80), nullable=False),
        sa.Column("scope_year", sa.Integer(), nullable=True),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("item_count", sa.Integer(), nullable=False),
        sa.Column("source_url", sa.String(length=255), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_snapshots_resource"),
        "saude_snapshots",
        ["resource"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_snapshots_scope_year"),
        "saude_snapshots",
        ["scope_year"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_snapshots_synced_at"),
        "saude_snapshots",
        ["synced_at"],
        unique=False,
    )

    op.create_table(
        "saude_sync_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("trigger_type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("resources_json", sa.Text(), nullable=False),
        sa.Column("years_json", sa.Text(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_sync_logs_started_at"),
        "saude_sync_logs",
        ["started_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_sync_logs_status"), "saude_sync_logs", ["status"], unique=False
    )
    op.create_index(
        "ix_saude_sync_logs_started_status",
        "saude_sync_logs",
        ["started_at", "status"],
        unique=False,
    )

    op.create_table(
        "saude_unidades",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("unit_type", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("neighborhood", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("latitude", sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("external_id", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=60), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_unidades_external_id"),
        "saude_unidades",
        ["external_id"],
        unique=True,
    )
    op.create_index(
        op.f("ix_saude_unidades_is_active"),
        "saude_unidades",
        ["is_active"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_unidades_name"), "saude_unidades", ["name"], unique=False
    )
    op.create_index(
        op.f("ix_saude_unidades_neighborhood"),
        "saude_unidades",
        ["neighborhood"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_unidades_unit_type"),
        "saude_unidades",
        ["unit_type"],
        unique=False,
    )
    op.create_index(
        "ix_saude_unidades_tipo_ativo",
        "saude_unidades",
        ["unit_type", "is_active"],
        unique=False,
    )

    op.create_table(
        "saude_unidade_horarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("day_of_week", sa.String(length=20), nullable=False),
        sa.Column("opens_at", sa.Time(), nullable=True),
        sa.Column("closes_at", sa.Time(), nullable=True),
        sa.Column("is_closed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["unit_id"], ["saude_unidades.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "unit_id", "day_of_week", name="uq_saude_unidade_horario_dia"
        ),
    )
    op.create_index(
        "ix_saude_unidade_horarios_unit",
        "saude_unidade_horarios",
        ["unit_id", "day_of_week"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_saude_unidade_horarios_unit", table_name="saude_unidade_horarios")
    op.drop_table("saude_unidade_horarios")
    op.drop_index("ix_saude_unidades_tipo_ativo", table_name="saude_unidades")
    op.drop_index(op.f("ix_saude_unidades_unit_type"), table_name="saude_unidades")
    op.drop_index(op.f("ix_saude_unidades_neighborhood"), table_name="saude_unidades")
    op.drop_index(op.f("ix_saude_unidades_name"), table_name="saude_unidades")
    op.drop_index(op.f("ix_saude_unidades_is_active"), table_name="saude_unidades")
    op.drop_index(op.f("ix_saude_unidades_external_id"), table_name="saude_unidades")
    op.drop_table("saude_unidades")
    op.drop_index("ix_saude_sync_logs_started_status", table_name="saude_sync_logs")
    op.drop_index(op.f("ix_saude_sync_logs_status"), table_name="saude_sync_logs")
    op.drop_index(op.f("ix_saude_sync_logs_started_at"), table_name="saude_sync_logs")
    op.drop_table("saude_sync_logs")
    op.drop_index(op.f("ix_saude_snapshots_synced_at"), table_name="saude_snapshots")
    op.drop_index(op.f("ix_saude_snapshots_scope_year"), table_name="saude_snapshots")
    op.drop_index(op.f("ix_saude_snapshots_resource"), table_name="saude_snapshots")
    op.drop_table("saude_snapshots")
