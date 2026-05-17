"""add_cargos_table

Revision ID: ce7ff8f70337
Revises: e699d3ca5215
Create Date: 2026-05-17 10:57:36.580767

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ce7ff8f70337"
down_revision: str | None = "e699d3ca5215"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create cargos table."""
    op.create_table(
        "cargos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("cargo", sa.String(length=500), nullable=False),
        sa.Column("carga_horaria", sa.String(length=20), nullable=True),
        sa.Column("vagas_totais", sa.Integer(), nullable=False),
        sa.Column("vagas_ocupadas", sa.Integer(), nullable=False),
        sa.Column("salario_base", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("efetivo", sa.Integer(), nullable=False),
        sa.Column("comissionado", sa.Integer(), nullable=False),
        sa.Column("contratado", sa.Integer(), nullable=False),
        sa.Column("eletivo", sa.Integer(), nullable=False),
        sa.Column("categoria", sa.String(length=50), nullable=False),
        sa.Column("fonte", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ano", "cargo", "categoria", name="uq_cargo_identity"),
    )
    op.create_index("ix_cargo_ano", "cargos", ["ano"], unique=False)
    op.create_index(
        "ix_cargo_ano_categoria", "cargos", ["ano", "categoria"], unique=False
    )


def downgrade() -> None:
    """Drop cargos table."""
    op.drop_index("ix_cargo_ano_categoria", table_name="cargos")
    op.drop_index("ix_cargo_ano", table_name="cargos")
    op.drop_table("cargos")
