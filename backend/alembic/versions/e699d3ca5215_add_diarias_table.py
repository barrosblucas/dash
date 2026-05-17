"""add_diarias_table

Revision ID: e699d3ca5215
Revises: 5e79bec64e46
Create Date: 2026-05-17 10:55:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e699d3ca5215"
down_revision: str | None = "5e79bec64e46"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create diarias table."""
    op.create_table(
        "diarias",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("numero_empenho", sa.Integer(), nullable=False),
        sa.Column("numero_liquidacao", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=500), nullable=False),
        sa.Column("historico", sa.Text(), nullable=True),
        sa.Column("destino", sa.String(length=200), nullable=True),
        sa.Column("periodo", sa.String(length=200), nullable=True),
        sa.Column("valor_total", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("valor_devolvido", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("fonte", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ano",
            "mes",
            "numero_empenho",
            "numero_liquidacao",
            name="uq_diaria_identity",
        ),
    )
    op.create_index("ix_diaria_ano_mes", "diarias", ["ano", "mes"], unique=False)
    op.create_index("ix_diaria_ano", "diarias", ["ano"], unique=False)


def downgrade() -> None:
    """Drop diarias table."""
    op.drop_index("ix_diaria_ano", table_name="diarias")
    op.drop_index("ix_diaria_ano_mes", table_name="diarias")
    op.drop_table("diarias")
