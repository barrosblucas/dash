#!/usr/bin/env python3
"""
Gate: Check de migration Alembic quando models.py mudar.

Verifica se houve alteração em infrastructure/database/models.py
sem correspondente migration Alembic criada.

Uso:
    python scripts/check_alembic_migration.py

Exit codes:
    0: sem problemas (ou sem migrations configuradas)
    1: models.py mudou sem nova migration
"""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).parent.parent.resolve()
    models_path = root / "backend" / "infrastructure" / "database" / "models.py"
    alembic_dir = (
        root / "backend" / "infrastructure" / "database" / "migrations" / "versions"
    )

    if not models_path.exists():
        print("⚠️  models.py não encontrado. Pulando check.")
        return 0

    # Se não há diretório de versions, migrations não estão configuradas
    if not alembic_dir.exists():
        print("⚠️  Diretório de migrations não encontrado. Pulando check.")
        return 0

    # Verificar se models.py foi modificado no working tree
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--", str(models_path)],
            capture_output=True,
            text=True,
            cwd=str(root),
        )
        models_changed = bool(result.stdout.strip())
    except Exception:
        # Se não for repo git ou git não disponível, pular
        print("⚠️  Não foi possível verificar diff git. Pulando check.")
        return 0

    if not models_changed:
        print("✅ models.py sem mudanças. Nenhuma migration necessária.")
        return 0

    # Models mudou — verificar se há nova migration
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--", str(alembic_dir)],
            capture_output=True,
            text=True,
            cwd=str(root),
        )
        migration_added = bool(result.stdout.strip())
    except Exception:
        migration_added = False

    if migration_added:
        print("✅ models.py mudou e nova migration detectada.")
        return 0

    print("❌ models.py foi alterado sem correspondente migration Alembic.")
    print(
        "   Crie uma migration: cd backend && alembic revision --autogenerate -m 'descrição'"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
