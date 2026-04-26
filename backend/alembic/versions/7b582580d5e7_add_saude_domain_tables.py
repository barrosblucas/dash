"""add saude domain tables

Revision ID: 7b582580d5e7
Revises: 686fd3aaaeb2
Create Date: 2026-04-26 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "7b582580d5e7"
down_revision: str | None = "686fd3aaaeb2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saude_medicamentos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_name", sa.String(length=500), nullable=False),
        sa.Column("unit", sa.String(length=100), nullable=True),
        sa.Column("in_stock", sa.Integer(), nullable=False),
        sa.Column("minimum_stock", sa.Integer(), nullable=True),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("establishment", sa.String(length=255), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "product_name", "department", "establishment",
            name="uq_saude_medicamento_prod_dept_estab",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_medicamentos_product_name"),
        "saude_medicamentos",
        ["product_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_medicamentos_synced_at"),
        "saude_medicamentos",
        ["synced_at"],
        unique=False,
    )
    op.create_index(
        "ix_saude_medicamentos_estab",
        "saude_medicamentos",
        ["establishment"],
        unique=False,
    )

    op.create_table(
        "saude_farmacia",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=True),
        sa.Column("dataset", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("quantidade", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "ano", "mes", "dataset", "label", name="uq_saude_farmacia_row"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_farmacia_ano"),
        "saude_farmacia",
        ["ano"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_farmacia_dataset"),
        "saude_farmacia",
        ["dataset"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_farmacia_mes"),
        "saude_farmacia",
        ["mes"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_farmacia_synced_at"),
        "saude_farmacia",
        ["synced_at"],
        unique=False,
    )
    op.create_index(
        "ix_saude_farmacia_ano_dataset",
        "saude_farmacia",
        ["ano", "dataset"],
        unique=False,
    )

    op.create_table(
        "saude_vacinacao",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=True),
        sa.Column("dataset", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("quantidade", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "ano", "mes", "dataset", "label", name="uq_saude_vacinacao_row"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_vacinacao_ano"),
        "saude_vacinacao",
        ["ano"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_vacinacao_dataset"),
        "saude_vacinacao",
        ["dataset"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_vacinacao_mes"),
        "saude_vacinacao",
        ["mes"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_vacinacao_synced_at"),
        "saude_vacinacao",
        ["synced_at"],
        unique=False,
    )
    op.create_index(
        "ix_saude_vacinacao_ano_dataset",
        "saude_vacinacao",
        ["ano", "dataset"],
        unique=False,
    )

    op.create_table(
        "saude_epidemiologico",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dataset", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("valor", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "dataset", "label", name="uq_saude_epidemiologico_row"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_epidemiologico_dataset"),
        "saude_epidemiologico",
        ["dataset"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_epidemiologico_synced_at"),
        "saude_epidemiologico",
        ["synced_at"],
        unique=False,
    )

    op.create_table(
        "saude_atencao_primaria",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=True),
        sa.Column("dataset", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("quantidade", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            "ano", "mes", "dataset", "label", name="uq_saude_atencao_primaria_row"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_atencao_primaria_ano"),
        "saude_atencao_primaria",
        ["ano"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_atencao_primaria_dataset"),
        "saude_atencao_primaria",
        ["dataset"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_atencao_primaria_mes"),
        "saude_atencao_primaria",
        ["mes"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_atencao_primaria_synced_at"),
        "saude_atencao_primaria",
        ["synced_at"],
        unique=False,
    )
    op.create_index(
        "ix_saude_ap_ano_dataset",
        "saude_atencao_primaria",
        ["ano", "dataset"],
        unique=False,
    )

    op.create_table(
        "saude_bucal",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=True),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("quantidade", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("label", name="uq_saude_bucal_label"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_bucal_ano"),
        "saude_bucal",
        ["ano"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saude_bucal_synced_at"),
        "saude_bucal",
        ["synced_at"],
        unique=False,
    )

    op.create_table(
        "saude_procedimentos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("quantidade", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("label", name="uq_saude_procedimentos_label"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saude_procedimentos_synced_at"),
        "saude_procedimentos",
        ["synced_at"],
        unique=False,
    )
    op.create_index(
        "ix_saude_procedimentos_label",
        "saude_procedimentos",
        ["label"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_saude_procedimentos_label", table_name="saude_procedimentos"
    )
    op.drop_index(
        op.f("ix_saude_procedimentos_synced_at"), table_name="saude_procedimentos"
    )
    op.drop_table("saude_procedimentos")

    op.drop_index(
        op.f("ix_saude_bucal_synced_at"), table_name="saude_bucal"
    )
    op.drop_index(op.f("ix_saude_bucal_ano"), table_name="saude_bucal")
    op.drop_table("saude_bucal")

    op.drop_index(
        "ix_saude_ap_ano_dataset", table_name="saude_atencao_primaria"
    )
    op.drop_index(
        op.f("ix_saude_atencao_primaria_synced_at"),
        table_name="saude_atencao_primaria",
    )
    op.drop_index(
        op.f("ix_saude_atencao_primaria_mes"),
        table_name="saude_atencao_primaria",
    )
    op.drop_index(
        op.f("ix_saude_atencao_primaria_dataset"),
        table_name="saude_atencao_primaria",
    )
    op.drop_index(
        op.f("ix_saude_atencao_primaria_ano"),
        table_name="saude_atencao_primaria",
    )
    op.drop_table("saude_atencao_primaria")

    op.drop_index(
        op.f("ix_saude_epidemiologico_synced_at"),
        table_name="saude_epidemiologico",
    )
    op.drop_index(
        op.f("ix_saude_epidemiologico_dataset"),
        table_name="saude_epidemiologico",
    )
    op.drop_table("saude_epidemiologico")

    op.drop_index(
        "ix_saude_vacinacao_ano_dataset", table_name="saude_vacinacao"
    )
    op.drop_index(
        op.f("ix_saude_vacinacao_synced_at"), table_name="saude_vacinacao"
    )
    op.drop_index(
        op.f("ix_saude_vacinacao_mes"), table_name="saude_vacinacao"
    )
    op.drop_index(
        op.f("ix_saude_vacinacao_dataset"), table_name="saude_vacinacao"
    )
    op.drop_index(
        op.f("ix_saude_vacinacao_ano"), table_name="saude_vacinacao"
    )
    op.drop_table("saude_vacinacao")

    op.drop_index(
        "ix_saude_farmacia_ano_dataset", table_name="saude_farmacia"
    )
    op.drop_index(
        op.f("ix_saude_farmacia_synced_at"), table_name="saude_farmacia"
    )
    op.drop_index(
        op.f("ix_saude_farmacia_mes"), table_name="saude_farmacia"
    )
    op.drop_index(
        op.f("ix_saude_farmacia_dataset"), table_name="saude_farmacia"
    )
    op.drop_index(
        op.f("ix_saude_farmacia_ano"), table_name="saude_farmacia"
    )
    op.drop_table("saude_farmacia")

    op.drop_index(
        "ix_saude_medicamentos_estab", table_name="saude_medicamentos"
    )
    op.drop_index(
        op.f("ix_saude_medicamentos_synced_at"),
        table_name="saude_medicamentos",
    )
    op.drop_index(
        op.f("ix_saude_medicamentos_product_name"),
        table_name="saude_medicamentos",
    )
    op.drop_table("saude_medicamentos")
