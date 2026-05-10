"""add_management_actions_table

Revision ID: 94306d83aae8
Revises: a1307f31be14
Create Date: 2026-05-10 17:37:15.682737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94306d83aae8'
down_revision: Union[str, None] = 'a1307f31be14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('management_actions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.Column('category_icon', sa.String(length=100), nullable=False),
    sa.Column('investment_raw', sa.Float(), nullable=False),
    sa.Column('impact_label', sa.String(length=100), nullable=False),
    sa.Column('impact_number', sa.Float(), nullable=False),
    sa.Column('impact_suffix', sa.String(length=50), nullable=False),
    sa.Column('image', sa.String(length=500), nullable=True),
    sa.Column('month', sa.String(length=50), nullable=False),
    sa.Column('year', sa.String(length=4), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('color', sa.String(length=7), nullable=False),
    sa.Column('progress', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('management_actions')
