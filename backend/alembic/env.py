"""Alembic environment configuration."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from sqlalchemy.engine import Engine

from alembic import context

# Ensure project root is on sys.path for absolute imports.
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend.shared.database.connection import create_db_engine  # noqa: E402
from backend.shared.database.models import Base  # noqa: E402

# This is the Alembic Config object, which provides access to the values within
# the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    from logging.config import fileConfig

    fileConfig(config.config_file_name)

logger = logging.getLogger("alembic.env")

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    By skipping the Engine creation we don't even need a DBAPI to be available.
    """
    # Offline url built from the same default used by the app.
    from backend.shared.database.connection import DEFAULT_DB_PATH

    url = f"sqlite:///{DEFAULT_DB_PATH}"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context. We reuse the project's engine factory so that all SQLite
    pragmas and connection args are identical to runtime.
    """
    configured_url = config.get_main_option("sqlalchemy.url")
    if configured_url and configured_url.startswith("sqlite:///"):
        db_path = Path(configured_url.replace("sqlite:///", ""))
        connectable: Engine = create_db_engine(db_path)
    else:
        connectable = create_db_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
