"""add_progresso_fisico_to_obra_medicoes

Revision ID: e7f8a9b0c1d2
Revises: e6f7a8b9c0d1
Create Date: 2026-05-04 20:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: str | None = "e6f7a8b9c0d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "obra_medicoes",
        sa.Column("progresso_fisico", sa.Numeric(5, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("obra_medicoes", "progresso_fisico")
