#!/usr/bin/env python3
"""
Gate: Check de console.log/print em código de produção.

Bloqueia console.* em TypeScript de produção e print() em Python de produção.
Arquivos de teste e scripts são isentos.

Uso:
    python scripts/check_no_console.py

Exit codes:
    0: sem violações
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
    "venv",
    ".venv",
    ".ruff_cache",
    "dist",
    "build",
    "coverage",
    ".pytest_cache",
}

# Padrões proibidos
TS_CONSOLE_PATTERN = re.compile(r"console\.(log|warn|error|debug|info)\(")
PY_PRINT_PATTERN = re.compile(r"\bprint\s*\(")

# Arquivos/dirs que são isentos (testes, scripts, config)
EXEMPT_SUFFIXES_TS = {".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"}
EXEMPT_SUFFIXES_PY = {"_test.py", "test_.py"}
EXEMPT_DIRS = {"tests", "test", "__tests__", "scripts", "notebooks"}
# Arquivos específicos isentos (scripts CLI, inicialização, entrypoint)
EXEMPT_FILES_PY = {
    "init_db.py",
    "init_db_simple.py",
    "reimport_data.py",
    "main.py",  # FastAPI entrypoint (lifespan logs são aceitáveis)
}


def should_ignore(path: Path, root: Path) -> bool:
    """Verifica se o path deve ser ignorado."""
    rel = path.relative_to(root)
    for part in rel.parts:
        if part in IGNORE_DIRS:
            return True
    # Diretórios isentos
    for exempt in EXEMPT_DIRS:
        if exempt in rel.parts:
            return True
    return False


def is_exempt_file(path: Path) -> bool:
    """Verifica se o arquivo é isento (teste ou script)."""
    name = path.name
    suffix = "".join(path.suffixes)  # ex: .test.tsx

    if suffix in EXEMPT_SUFFIXES_TS:
        return True
    for exempt in EXEMPT_SUFFIXES_PY:
        if name.endswith(exempt):
            return True
    if name == "conftest.py":
        return True
    if name in EXEMPT_FILES_PY:
        return True
    return False


def check_ts_file(path: Path) -> list[tuple[int, str]]:
    """Check console.* em arquivo TypeScript."""
    violations = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line_num, line in enumerate(f, start=1):
                if TS_CONSOLE_PATTERN.search(line):
                    violations.append((line_num, line.strip()))
    except Exception:
        pass
    return violations


def check_py_file(path: Path) -> list[tuple[int, str]]:
    """Check print() em arquivo Python."""
    violations = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line_num, line in enumerate(f, start=1):
                # Ignorar linhas em strings/comentários simples
                stripped = line.strip()
                if stripped.startswith("#"):
                    continue
                if stripped.startswith('"""') or stripped.startswith("'''"):
                    continue
                if PY_PRINT_PATTERN.search(line):
                    violations.append((line_num, line.strip()))
    except Exception:
        pass
    return violations


def main() -> int:
    root = Path(__file__).parent.parent.resolve()
    total_violations = 0

    # Check TypeScript
    frontend_dir = root / "frontend"
    if frontend_dir.exists():
        for path in frontend_dir.rglob("*"):
            if not path.is_file() or path.suffix not in (".ts", ".tsx"):
                continue
            if should_ignore(path, root):
                continue
            if is_exempt_file(path):
                continue

            violations = check_ts_file(path)
            if violations:
                rel_path = str(path.relative_to(root))
                for line_num, line_content in violations:
                    print(f"❌ {rel_path}:{line_num}: console.* em produção")
                    print(f"   {line_content}")
                    total_violations += 1

    # Check Python
    backend_dir = root / "backend"
    if backend_dir.exists():
        for path in backend_dir.rglob("*"):
            if not path.is_file() or path.suffix != ".py":
                continue
            if should_ignore(path, root):
                continue
            if is_exempt_file(path):
                continue

            violations = check_py_file(path)
            if violations:
                rel_path = str(path.relative_to(root))
                for line_num, line_content in violations:
                    print(f"❌ {rel_path}:{line_num}: print() em produção")
                    print(f"   {line_content}")
                    total_violations += 1

    if total_violations > 0:
        print(f"\nTotal: {total_violations} violações.")
        print("Use logger estruturado (Python) ou remova (TypeScript).")
        return 1

    print("✅ Nenhum console.log/print em código de produção.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
