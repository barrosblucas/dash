"""
Cria (ou atualiza) o usuário admin no banco de dados.

Uso:
    python -m backend.scripts.seed_admin
    # ou com variáveis de ambiente:
    BOOTSTRAP_ADMIN_NAME="Admin" BOOTSTRAP_ADMIN_EMAIL="admin@example.com" BOOTSTRAP_ADMIN_PASSWORD="secret123" python -m backend.scripts.seed_admin
"""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.shared.database.connection import DatabaseManager
from backend.shared.database.models import UserModel
from backend.shared.security import hash_password
from backend.shared.settings import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

DEFAULT_ADMIN_NAME = "Admin"
DEFAULT_ADMIN_EMAIL = "admin@bandeirantes.ms.gov.br"
DEFAULT_ADMIN_PASSWORD = "admin123"


def main() -> None:
    settings = get_settings()
    name = settings.bootstrap_admin_name or DEFAULT_ADMIN_NAME
    email = (settings.bootstrap_admin_email or DEFAULT_ADMIN_EMAIL).strip().lower()
    password = settings.bootstrap_admin_password or DEFAULT_ADMIN_PASSWORD

    if len(password) < 8:
        logger.error("A senha deve ter no mínimo 8 caracteres.")
        sys.exit(1)

    db_manager = DatabaseManager()

    with db_manager.get_session() as session:
        existing = session.query(UserModel).filter(UserModel.email == email).first()

        if existing:
            existing.name = name
            existing.password_hash = hash_password(password)
            existing.role = "admin"
            existing.is_active = True
            logger.info("Admin atualizado: %s (id=%s)", email, existing.id)
        else:
            admin = UserModel(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="admin",
                is_active=True,
                token_version=0,
            )
            session.add(admin)
            session.flush()
            logger.info("Admin criado: %s (id=%s)", email, admin.id)


if __name__ == "__main__":
    main()
