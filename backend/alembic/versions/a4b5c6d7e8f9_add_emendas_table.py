"""add_emendas_table

Revision ID: a4b5c6d7e8f9
Revises: ce7ff8f70337
Create Date: 2026-05-17 11:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a4b5c6d7e8f9"
down_revision: str | None = "ce7ff8f70337"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create emendas table."""
    op.create_table(
        "emendas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("emenda", sa.String(length=100), nullable=False),
        sa.Column("tipo_emenda", sa.String(length=200), nullable=False),
        sa.Column("numero_protocolo", sa.String(length=50), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("valor", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("detalhes_link", sa.String(length=1000), nullable=True),
        sa.Column("fonte", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ano", "emenda", "numero_protocolo",
            name="uq_emenda_identity",
        ),
    )
    op.create_index("ix_emenda_ano", "emendas", ["ano"], unique=False)
    op.create_index(
        "ix_emenda_tipo_ano", "emendas", ["tipo_emenda", "ano"], unique=False
    )


def downgrade() -> None:
    """Drop emendas table."""
    op.drop_index("ix_emenda_tipo_ano", table_name="emendas")
    op.drop_index("ix_emenda_ano", table_name="emendas")
    op.drop_table("emendas")
