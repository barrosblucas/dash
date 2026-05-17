"""add_patrimonio_table

Revision ID: b0c1d2e3f4a5
Revises: a4b5c6d7e8f9
Create Date: 2026-05-17 11:30:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b0c1d2e3f4a5"
down_revision: str | None = "a4b5c6d7e8f9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create patrimonio table."""
    op.create_table(
        "patrimonio",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("tipo_bem", sa.String(length=50), nullable=False),
        sa.Column("descricao", sa.String(length=500), nullable=False),
        sa.Column("quantidade_anterior", sa.Integer(), nullable=False),
        sa.Column("valor_anterior", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("quantidade_adquiridos", sa.Integer(), nullable=False),
        sa.Column("valor_adquiridos", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("quantidade_baixados", sa.Integer(), nullable=False),
        sa.Column("valor_baixados", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("quantidade_atual", sa.Integer(), nullable=False),
        sa.Column("valor_atual", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("fonte", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ano",
            "tipo_bem",
            "descricao",
            name="uq_patrimonio_identity",
        ),
    )
    op.create_index("ix_patrimonio_ano", "patrimonio", ["ano"], unique=False)
    op.create_index(
        "ix_patrimonio_tipo_bem_ano", "patrimonio", ["tipo_bem", "ano"], unique=False
    )


def downgrade() -> None:
    """Drop patrimonio table."""
    op.drop_index("ix_patrimonio_tipo_bem_ano", table_name="patrimonio")
    op.drop_index("ix_patrimonio_ano", table_name="patrimonio")
    op.drop_table("patrimonio")
