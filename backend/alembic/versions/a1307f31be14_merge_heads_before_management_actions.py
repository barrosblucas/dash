"""merge_heads_before_management_actions

Revision ID: a1307f31be14
Revises: e7f8a9b0c1d2, f0e1d2c3b4a5
Create Date: 2026-05-10 17:37:07.623149

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = 'a1307f31be14'
down_revision: str | None = ('e7f8a9b0c1d2', 'f0e1d2c3b4a5')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
