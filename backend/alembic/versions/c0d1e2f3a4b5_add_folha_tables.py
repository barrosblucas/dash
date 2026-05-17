"""add_folha_tables

Revision ID: c0d1e2f3a4b5
Revises: b0c1d2e3f4a5
Create Date: 2026-05-17 12:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c0d1e2f3a4b5"
down_revision: str | None = "b0c1d2e3f4a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create folha_offices and folha_employees tables."""
    # --- folha_offices ---
    op.create_table(
        "folha_offices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("office_id", sa.Integer(), nullable=False),
        sa.Column("office_description", sa.String(length=500), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("department_description", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ano", "mes", "office_id", "department_id",
            name="uq_folha_office_period",
        ),
    )
    op.create_index(
        "ix_folha_offices_period", "folha_offices", ["ano", "mes"], unique=False,
    )
    op.create_index(
        "ix_folha_offices_office", "folha_offices",
        ["office_id", "ano", "mes"], unique=False,
    )

    # --- folha_employees ---
    op.create_table(
        "folha_employees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("office_id", sa.Integer(), nullable=False),
        sa.Column("office_description", sa.String(length=500), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("department_description", sa.String(length=500), nullable=False),
        sa.Column("contract", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=500), nullable=False),
        sa.Column("cpf", sa.String(length=20), nullable=False),
        sa.Column("role", sa.String(length=500), nullable=False),
        sa.Column("class_and_level", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=50), nullable=False),
        sa.Column("admission_date", sa.String(length=20), nullable=False),
        sa.Column("end_date", sa.String(length=20), nullable=False),
        sa.Column("base_salary", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("tenth_salary", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("vacation", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("gratification", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("others_earnings", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("discounts", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("gross_salary", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("net_salary", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("role_type_id", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ano", "mes", "contract", "office_id", "department_id",
            name="uq_folha_employee_period",
        ),
    )
    op.create_index(
        "ix_folha_employees_period", "folha_employees", ["ano", "mes"], unique=False,
    )
    op.create_index(
        "ix_folha_employees_office", "folha_employees",
        ["office_id", "ano", "mes"], unique=False,
    )
    op.create_index(
        "ix_folha_employees_name", "folha_employees", ["name"], unique=False,
    )


def downgrade() -> None:
    """Drop folha tables."""
    op.drop_index("ix_folha_employees_name", table_name="folha_employees")
    op.drop_index("ix_folha_employees_office", table_name="folha_employees")
    op.drop_index("ix_folha_employees_period", table_name="folha_employees")
    op.drop_table("folha_employees")
    op.drop_index("ix_folha_offices_office", table_name="folha_offices")
    op.drop_index("ix_folha_offices_period", table_name="folha_offices")
    op.drop_table("folha_offices")
