"""add_contratos_table

Revision ID: 5ed4359a4e35
Revises: 94306d83aae8
Create Date: 2026-05-17 10:14:09.383807

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5ed4359a4e35'
down_revision: str | None = '94306d83aae8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create contratos table."""
    op.create_table('contratos',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('ano', sa.Integer(), nullable=False),
    sa.Column('numero', sa.String(length=50), nullable=False),
    sa.Column('fornecedor', sa.String(length=500), nullable=False),
    sa.Column('cpf_cnpj', sa.String(length=20), nullable=False),
    sa.Column('tipo', sa.String(length=100), nullable=False),
    sa.Column('vigencia', sa.String(length=200), nullable=True),
    sa.Column('valor', sa.Numeric(precision=18, scale=2), nullable=False),
    sa.Column('objeto', sa.Text(), nullable=True),
    sa.Column('processo_numero', sa.String(length=50), nullable=True),
    sa.Column('licitacao', sa.String(length=100), nullable=True),
    sa.Column('assunto', sa.String(length=200), nullable=True),
    sa.Column('qtd_aditivos', sa.Integer(), nullable=True),
    sa.Column('valor_contratado', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('valor_atualizado', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('saldo_pagar', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('valor_anulado', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('dotacoes_orcamentarias', sa.Text(), nullable=True),
    sa.Column('fiscais_json', sa.Text(), nullable=True),
    sa.Column('fonte', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('ano', 'numero', name='uq_contrato_ano_numero')
    )
    op.create_index('ix_contrato_ano', 'contratos', ['ano'], unique=False)
    op.create_index('ix_contrato_tipo_ano', 'contratos', ['tipo', 'ano'], unique=False)


def downgrade() -> None:
    """Drop contratos table."""
    op.drop_index('ix_contrato_tipo_ano', table_name='contratos')
    op.drop_index('ix_contrato_ano', table_name='contratos')
    op.drop_table('contratos')
