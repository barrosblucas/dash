"""
Gerenciamento de conexão com o banco de dados SQLite.

Fornece uma fábrica de sessões e utilitários para gerenciamento do banco.
"""

import logging
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from alembic.config import Config as AlembicConfig
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from alembic import command as alembic_command

from .models import Base

logger = logging.getLogger(__name__)

# Diretório padrão para o banco de dados
DEFAULT_DB_DIR = Path(__file__).parent.parent.parent.parent / "database"
DEFAULT_DB_PATH = DEFAULT_DB_DIR / "dashboard.db"


def create_db_engine(db_path: Path | None = None) -> Engine:
    """
    Cria uma engine do SQLAlchemy para o banco SQLite.

    Args:
        db_path: Caminho para o arquivo do banco de dados.
                 Se None, usa o caminho padrão.

    Returns:
        Engine: Engine do SQLAlchemy configurada.

    Example:
        >>> engine = create_db_engine()
        >>> engine = create_db_engine(Path("/custom/path/db.sqlite"))
    """
    if db_path is None:
        db_path = DEFAULT_DB_PATH

    # Garante que o diretório existe
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # URL de conexão SQLite
    database_url = f"sqlite:///{db_path}"

    engine = create_engine(
        database_url,
        echo=False,
        future=True,
        poolclass=NullPool,
        connect_args={
            "check_same_thread": False,
            "timeout": 60,
        },
    )

    # Configurar SQLite para usar foreign keys
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
        """Configura pragmas do SQLite para melhor performance."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

    return engine


def create_session_factory(engine: Engine | None = None) -> sessionmaker:
    """
    Cria uma fábrica de sessões do SQLAlchemy.

    Args:
        engine: Engine do SQLAlchemy. Se None, cria uma nova.

    Returns:
        sessionmaker: Fábrica de sessões configurada.

    Example:
        >>> SessionLocal = create_session_factory()
        >>> with SessionLocal() as session:
        ...     # usar session
        ...     pass
    """
    if engine is None:
        engine = create_db_engine()

    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )


class DatabaseManager:
    """
    Gerenciador do banco de dados.

    Fornece métodos para inicialização, reset e manutenção do banco.

    Example:
        >>> db_manager = DatabaseManager()
        >>> db_manager.create_tables()
        >>> db_manager.drop_tables()
    """

    def __init__(self, db_path: Path | None = None):
        """
        Inicializa o gerenciador.

        Args:
            db_path: Caminho para o arquivo do banco.
        """
        self.db_path = db_path or DEFAULT_DB_PATH
        self.engine = create_db_engine(self.db_path)
        self.SessionLocal = create_session_factory(self.engine)

    def create_tables(self) -> None:
        """Cria todas as tabelas no banco de dados."""
        Base.metadata.create_all(self.engine)

    def drop_tables(self) -> None:
        """Remove todas as tabelas do banco de dados."""
        Base.metadata.drop_all(self.engine)

    def reset_database(self) -> None:
        """Recria o banco de dados do zero."""
        self.drop_tables()
        self.create_tables()

    @contextmanager
    def get_session(self) -> Generator[Session]:
        """
        Context manager para obter uma sessão do banco.

        Yields:
            Session: Sessão do SQLAlchemy.

        Example:
            >>> with db_manager.get_session() as session:
            ...     receitas = session.query(ReceitaModel).all()
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def get_db_stats(self) -> dict:
        """
        Retorna estatísticas do banco de dados.

        Returns:
            dict: Dicionário com contagem de registros por tabela.
        """
        with self.get_session() as session:
            receitas_count = session.execute(
                text("SELECT COUNT(*) FROM receitas")
            ).scalar()
            despesas_count = session.execute(
                text("SELECT COUNT(*) FROM despesas")
            ).scalar()
            forecasts_count = session.execute(
                text("SELECT COUNT(*) FROM forecasts")
            ).scalar()
            users_count = session.execute(text("SELECT COUNT(*) FROM users")).scalar()
            obras_count = session.execute(text("SELECT COUNT(*) FROM obras")).scalar()

            return {
                "receitas": receitas_count or 0,
                "despesas": despesas_count or 0,
                "forecasts": forecasts_count or 0,
                "users": users_count or 0,
                "obras": obras_count or 0,
                "db_path": str(self.db_path),
                "db_exists": self.db_path.exists(),
            }

    def execute_sql_file(self, sql_file_path: Path) -> None:
        """
        Executa um arquivo SQL no banco de dados.

        Args:
            sql_file_path: Caminho para o arquivo SQL.
        """
        with open(sql_file_path, encoding="utf-8") as f:
            sql_content = f.read()

        with self.get_session() as session:
            # Divide em statements separados por ponto e vírgula
            statements = [
                stmt.strip()
                for stmt in sql_content.split(";")
                if stmt.strip() and not stmt.strip().startswith("--")
            ]
            for stmt in statements:
                if stmt:
                    session.execute(text(stmt))


# Instância global do gerenciador de banco
db_manager = DatabaseManager()


def get_db() -> Generator[Session]:
    """
    Dependency injection para FastAPI.

    Fornece uma sessão do banco para endpoints.

    Yields:
        Session: Sessão do SQLAlchemy.

    Example:
        >>> @app.get("/receitas")
        ... def get_receitas(db: Session = Depends(get_db)):
        ...     return db.query(ReceitaModel).all()
    """
    with db_manager.get_session() as session:
        yield session

def run_alembic_upgrade(db_path: Path | None = None) -> None:
    """Executa Alembic upgrade head para manter o schema sincronizado."""
    target_path = db_path or DEFAULT_DB_PATH
    database_url = f"sqlite:///{target_path}"

    alembic_ini = Path(__file__).parent.parent.parent / "alembic.ini"
    if not alembic_ini.exists():
        raise FileNotFoundError(f"Arquivo alembic.ini não encontrado: {alembic_ini}")

    alembic_cfg = AlembicConfig(str(alembic_ini))
    alembic_cfg.set_main_option(
        "script_location", str(alembic_ini.parent / "alembic")
    )
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    # Se o banco existe mas não tem alembic_version, faz stamp da base
    if target_path.exists():
        import sqlite3

        conn = sqlite3.connect(target_path)
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
        )
        has_alembic = cursor.fetchone() is not None
        conn.close()

        if not has_alembic:
            from alembic.script import ScriptDirectory

            script = ScriptDirectory.from_config(alembic_cfg)
            base = script.get_base()
            if base is not None:
                logger.info(
                    "Banco existente sem alembic_version. Stampando base %s",
                    base,
                )
                conn = sqlite3.connect(target_path)
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS alembic_version "
                    "(version_num VARCHAR(32) NOT NULL, PRIMARY KEY (version_num))"
                )
                conn.execute(
                    "INSERT INTO alembic_version (version_num) VALUES (?)",
                    (base,),
                )
                conn.commit()
                conn.close()
    logger.info("Executando Alembic upgrade head em: %s", target_path)
    alembic_command.upgrade(alembic_cfg, "head")
    logger.info("Migrations aplicadas com sucesso")

def init_database() -> None:
    """Inicializa o banco de dados criando as tabelas."""
    logger.info("Inicializando banco de dados em: %s", db_manager.db_path)
    db_manager.create_tables()
    logger.info("Tabelas criadas com sucesso!")

    stats = db_manager.get_db_stats()
    logger.info("Status do banco: %s", stats)
