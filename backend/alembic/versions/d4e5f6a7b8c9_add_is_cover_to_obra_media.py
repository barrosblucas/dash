"""add_is_cover_to_obra_media

Revision ID: d4e5f6a7b8c9
Revises: 1c2d3e4f5a6b
Create Date: 2026-05-04 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "1c2d3e4f5a6b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "obra_media_assets",
        sa.Column("is_cover", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index(
        "ix_obra_media_assets_cover",
        "obra_media_assets",
        ["obra_id", "is_cover"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_obra_media_assets_cover", table_name="obra_media_assets")
    op.drop_column("obra_media_assets", "is_cover")
