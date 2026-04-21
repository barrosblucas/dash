#!/usr/bin/env python3
"""
Gate: impede imports diretos entre features (bounded contexts).

Cada feature em backend/features/<name>/ só pode importar de:
  - seu próprio diretório
  - backend.shared.*
  - bibliotecas externas

Imports de uma feature para outra são proibidos e indicam acoplamento
que deve ser resolvido via shared/ ou via contratos em types.

Uso:
    python scripts/check_cross_feature_imports.py

Exit codes:
    0: nenhum import cruzado encontrado
    1: violações encontradas
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

FEATURES_DIR = Path(__file__).parent.parent / "backend" / "features"

# Features explicitamente autorizadas a importar de qualquer outra feature.
# São features de orquestração/agregação cujo propósito é coordenar
# múltiplos domínios. Esta lista DEVE ser auditada em cada review.
ORCHESTRATOR_FEATURES: set[str] = {
    "scraping",  # orquestra scrapers de múltiplos domínios
    "export",    # agregação read-side de múltiplos domínios
}

# Padrões de import que configuram acesso cross-feature
IMPORT_FROM_PATTERN = re.compile(r"from\s+backend\.features\.(\w+)")
IMPORT_PATTERN = re.compile(r"import\s+backend\.features\.(\w+)")


def check_file(filepath: Path) -> list[str]:
    """Retorna violações de import cruzado em um arquivo."""
    violations: list[str] = []

    try:
        content = filepath.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return violations

    parts = filepath.parts
    try:
        feature_idx = parts.index("features") + 1
    except ValueError:
        return violations

    if feature_idx >= len(parts):
        return violations

    own_feature = parts[feature_idx]

    # Orchestrator features são autorizadas a importar de qualquer feature
    is_orchestrator = own_feature in ORCHESTRATOR_FEATURES

    for line_no, line in enumerate(content.splitlines(), 1):
        # Ignora comentários
        stripped = line.strip()
        if stripped.startswith("#"):
            continue

        # Verifica from backend.features.<feature>
        for match in IMPORT_FROM_PATTERN.finditer(line):
            imported_feature = match.group(1)
            if imported_feature != own_feature and not is_orchestrator:
                violations.append(
                    f"  {filepath.relative_to(FEATURES_DIR.parent.parent)}:{line_no} — "
                    f"cross-feature import: {own_feature} → {imported_feature}"
                )

        # Verifica import backend.features.<feature>
        for match in IMPORT_PATTERN.finditer(line):
            imported_feature = match.group(1)
            if imported_feature != own_feature and not is_orchestrator:
                violations.append(
                    f"  {filepath.relative_to(FEATURES_DIR.parent.parent)}:{line_no} — "
                    f"cross-feature import: {own_feature} → {imported_feature}"
                )

    return violations


def main() -> int:
    """Executa verificação em todas as features."""
    if not FEATURES_DIR.exists():
        print("⚠️  Diretório backend/features/ não encontrado — pulando")
        return 0

    all_violations: list[str] = []

    for py_file in FEATURES_DIR.rglob("*.py"):
        violations = check_file(py_file)
        all_violations.extend(violations)

    if all_violations:
        print("❌ Imports cruzados entre features detectados:")
        for v in all_violations:
            print(v)
        print(f"\nTotal de violações: {len(all_violations)}")
        print(
            "\nUse backend.shared/ para código compartilhado ou "
            "defina contratos em *_types.py."
        )
        return 1

    print("✅ Nenhum import cruzado entre features — bounded contexts isolados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
