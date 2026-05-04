"""merge_alembic_heads

Revision ID: e6f7a8b9c0d1
Revises: a1b2c3d4e5f6, d4e5f6a7b8c9
Create Date: 2026-05-04 19:10:00.000000

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b9c0d1"
down_revision: str | tuple[str, str] | None = ("a1b2c3d4e5f6", "d4e5f6a7b8c9")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
