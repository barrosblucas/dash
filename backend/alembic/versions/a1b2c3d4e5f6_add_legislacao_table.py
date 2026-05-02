"""add_legislacao_table

Revision ID: a1b2c3d4e5f6
Revises: 90378bdd1b01
Create Date: 2026-05-01 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "90378bdd1b01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "legislacoes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tipo", sa.String(length=32), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("ementa", sa.Text(), nullable=False),
        sa.Column("texto_integral", sa.Text(), nullable=True),
        sa.Column("data_publicacao", sa.Date(), nullable=False),
        sa.Column("data_promulgacao", sa.Date(), nullable=True),
        sa.Column("data_vigencia_inicio", sa.Date(), nullable=True),
        sa.Column("data_vigencia_fim", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("autor", sa.String(length=255), nullable=True),
        sa.Column("sancionado_por", sa.String(length=255), nullable=True),
        sa.Column("origem", sa.String(length=255), nullable=True),
        sa.Column("legislacao_vinculada_json", sa.Text(), nullable=True),
        sa.Column("url_arquivo", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tipo", "numero", "ano", name="uq_legislacoes_tipo_numero_ano"
        ),
    )
    op.create_index(op.f("ix_legislacoes_tipo"), "legislacoes", ["tipo"], unique=False)
    op.create_index(op.f("ix_legislacoes_ano"), "legislacoes", ["ano"], unique=False)
    op.create_index(
        op.f("ix_legislacoes_status"), "legislacoes", ["status"], unique=False
    )
    op.create_index(
        "ix_legislacoes_ano_tipo", "legislacoes", ["ano", "tipo"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_legislacoes_ano_tipo", table_name="legislacoes")
    op.drop_index(op.f("ix_legislacoes_status"), table_name="legislacoes")
    op.drop_index(op.f("ix_legislacoes_ano"), table_name="legislacoes")
    op.drop_index(op.f("ix_legislacoes_tipo"), table_name="legislacoes")
    op.drop_table("legislacoes")
