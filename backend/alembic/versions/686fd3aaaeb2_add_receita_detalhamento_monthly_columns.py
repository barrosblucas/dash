"""add_receita_detalhamento_monthly_columns

Revision ID: 686fd3aaaeb2
Revises: 043c91035847
Create Date: 2026-04-25 16:57:46.254093

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "686fd3aaaeb2"
down_revision: str | None = "043c91035847"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "receita_detalhamento",
        sa.Column("valores_mensais", sa.Text(), nullable=True),
    )
    op.add_column(
        "receita_detalhamento",
        sa.Column("valores_anulados_mensais", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("receita_detalhamento", "valores_anulados_mensais")
    op.drop_column("receita_detalhamento", "valores_mensais")
