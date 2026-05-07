"""Add institutional tables (profile, departments, offices)

Revision ID: f0e1d2c3b4a5
Revises: e6f7a8b9c0d1
Create Date: 2026-05-06 00:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "f0e1d2c3b4a5"
down_revision: str | None = "e6f7a8b9c0d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "institucional_profile",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("city_hall_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("office_hours", sa.String(length=255), nullable=True),
        sa.Column(
            "social_links_json",
            sa.Text(),
            nullable=True,
            comment='JSON array: [{"label": "...", "url": "..."}]',
        ),
        sa.Column("mayor_name", sa.String(length=255), nullable=True),
        sa.Column("mayor_photo_url", sa.String(length=1000), nullable=True),
        sa.Column("mayor_bio", sa.Text(), nullable=True),
        sa.Column("vice_mayor_name", sa.String(length=255), nullable=True),
        sa.Column("vice_mayor_photo_url", sa.String(length=1000), nullable=True),
        sa.Column("vice_mayor_bio", sa.Text(), nullable=True),
        sa.Column("cabinet_chief_name", sa.String(length=255), nullable=True),
        sa.Column("cabinet_chief_photo_url", sa.String(length=1000), nullable=True),
        sa.Column("cabinet_chief_bio", sa.Text(), nullable=True),
        sa.Column("cabinet_description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "institucional_departments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "kind", sa.String(length=50), nullable=False, server_default="secretaria"
        ),
        sa.Column(
            "leader_title",
            sa.String(length=255),
            nullable=False,
            server_default="Secretário(a)",
        ),
        sa.Column("secretary_name", sa.String(length=255), nullable=True),
        sa.Column("secretary_photo_url", sa.String(length=1000), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("mission", sa.Text(), nullable=True),
        sa.Column("vision", sa.Text(), nullable=True),
        sa.Column("values", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("office_hours", sa.String(length=255), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_department_slug", "institucional_departments", ["slug"])
    op.create_index("ix_department_kind", "institucional_departments", ["kind"])

    op.create_table(
        "institucional_offices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column(
            "kind", sa.String(length=50), nullable=False, server_default="reparticao"
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("office_hours", sa.String(length=255), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["department_id"],
            ["institucional_departments.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_office_kind", "institucional_offices", ["kind"])
    op.create_index(
        "ix_office_department_kind", "institucional_offices", ["department_id", "kind"]
    )


def downgrade() -> None:
    op.drop_table("institucional_offices")
    op.drop_table("institucional_departments")
    op.drop_table("institucional_profile")
