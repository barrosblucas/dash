"""add_convocados_to_cargos

Revision ID: d5e6f7a8b9c0
Revises: c0d1e2f3a4b5
Create Date: 2026-05-17 12:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: str | None = "c0d1e2f3a4b5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add convocados column to cargos table."""
    op.add_column(
        "cargos",
        sa.Column("convocados", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Remove convocados column from cargos table."""
    op.drop_column("cargos", "convocados")
