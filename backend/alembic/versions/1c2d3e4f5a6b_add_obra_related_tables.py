"""add_obra_related_tables

Revision ID: 1c2d3e4f5a6b
Revises: 7b582580d5e7
Create Date: 2026-04-26 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1c2d3e4f5a6b"
down_revision: str | None = "7b582580d5e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "obra_locations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("sequencia", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("logradouro", sa.String(length=255), nullable=False),
        sa.Column("bairro", sa.String(length=255), nullable=False),
        sa.Column("cep", sa.String(length=20), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("obra_id", "sequencia", name="uq_obra_location_sequencia"),
    )
    op.create_index("ix_obra_locations_obra", "obra_locations", ["obra_id", "sequencia"], unique=False)

    op.create_table(
        "obra_funding_sources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("sequencia", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("valor", sa.Numeric(18, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("obra_id", "sequencia", name="uq_obra_funding_sequencia"),
    )
    op.create_index("ix_obra_funding_sources_obra", "obra_funding_sources", ["obra_id", "sequencia"], unique=False)

    op.create_table(
        "obra_media_assets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("obra_id", sa.Integer(), nullable=False),
        sa.Column("medicao_id", sa.Integer(), nullable=True),
        sa.Column("titulo", sa.String(length=255), nullable=True),
        sa.Column("media_kind", sa.String(length=50), nullable=False, server_default="image"),
        sa.Column("source_type", sa.String(length=20), nullable=False, server_default="url"),
        sa.Column("external_url", sa.String(length=1000), nullable=True),
        sa.Column("storage_path", sa.String(length=500), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(["medicao_id"], ["obra_medicoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_obra_media_assets_obra", "obra_media_assets", ["obra_id"], unique=False)
    op.create_index("ix_obra_media_assets_medicao", "obra_media_assets", ["medicao_id"], unique=False)

    op.execute(
        """
        INSERT INTO obra_locations (
            obra_id, sequencia, logradouro, bairro, cep, numero, latitude, longitude, created_at, updated_at
        )
        SELECT
            id, 1, logradouro, bairro, cep, numero, latitude, longitude, created_at, updated_at
        FROM obras
        """
    )
    op.execute(
        """
        INSERT INTO obra_funding_sources (
            obra_id, sequencia, nome, created_at, updated_at
        )
        SELECT
            id, 1, fonte_recurso, created_at, updated_at
        FROM obras
        """
    )


def downgrade() -> None:
    op.drop_index("ix_obra_media_assets_medicao", table_name="obra_media_assets")
    op.drop_index("ix_obra_media_assets_obra", table_name="obra_media_assets")
    op.drop_table("obra_media_assets")

    op.drop_index("ix_obra_funding_sources_obra", table_name="obra_funding_sources")
    op.drop_table("obra_funding_sources")

    op.drop_index("ix_obra_locations_obra", table_name="obra_locations")
    op.drop_table("obra_locations")
