#!/usr/bin/env python3
"""
Gate: Check de fronteiras do frontend.

Garante que o frontend não importa código do backend diretamente.
Frontend consome backend exclusivamente via HTTP.

Uso:
    python scripts/check_frontend_boundaries.py

Exit codes:
    0: nenhuma violação de fronteira
    1: violações encontradas
"""

import re
import sys
from pathlib import Path

IGNORE_DIRS = {
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "dist",
    "build",
    "coverage",
}

# Padrões proibidos em arquivos do frontend
FORBIDDEN_PATTERNS = [
    # Import absoluto ou relativo que suba até backend/
    (re.compile(r"(?:from|import)\s+['\"]\.\./backend"), "import relativo de backend"),
    (re.compile(r"(?:from|import)\s+['\"]backend"), "import absoluto de backend"),
    (re.compile(r"require\s*\(\s*['\"][^'\"]*backend/"), "require de backend"),
    # Import de SQLAlchemy
    (
        re.compile(r"(?:from|import)\s+['\"]sqlalchemy"),
        "import direto de sqlalchemy no frontend",
    ),
]


def should_ignore(path: Path) -> bool:
    """Verifica se o path deve ser ignorado."""
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    return False


def check_file(path: Path) -> list[tuple[int, str, str]]:
    """Verifica um arquivo. Retorna lista de (linha, padrão, descrição)."""
    violations = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line_num, line in enumerate(f, start=1):
                for pattern, description in FORBIDDEN_PATTERNS:
                    if pattern.search(line):
                        violations.append((line_num, line.strip(), description))
    except Exception:
        pass
    return violations


def main() -> int:
    root = Path(__file__).parent.parent.resolve()
    frontend_dir = root / "frontend"

    if not frontend_dir.exists():
        print("⚠️  Diretório frontend/ não encontrado. Pulando check.")
        return 0

    total_violations = 0

    for path in frontend_dir.rglob("*"):
        if not path.is_file():
            continue
        if should_ignore(path):
            continue
        if path.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue

        violations = check_file(path)
        if violations:
            rel_path = str(path.relative_to(root))
            for line_num, line_content, description in violations:
                print(f"❌ {rel_path}:{line_num}: {description}")
                print(f"   {line_content}")
                total_violations += 1

    if total_violations > 0:
        print(f"\nTotal: {total_violations} violações de fronteira.")
        print("Frontend deve consumir backend exclusivamente via HTTP.")
        return 1

    print("✅ Nenhuma violação de fronteira encontrada.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
