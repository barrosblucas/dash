#!/usr/bin/env python3
"""
Gate: Check de tamanho de arquivo.

Bloqueia arquivos que excedem o hard limit de linhas.
Arquivos fora do limite DEVEM ser refatorados antes do merge.

Não existem bypasses automáticos. Exception metadata serve apenas para
documentar débito técnico — NÃO isenta o arquivo do gate.

Uso:
    python scripts/check_file_length.py

Exit codes:
    0: todos os arquivos dentro do limite
    1: um ou mais arquivos excederam o limite
"""

import re
import sys
from pathlib import Path

# Diretórios a ignorar
IGNORE_DIRS = {
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "venv",
    ".venv",
    ".ruff_cache",
    ".pytest_cache",
    "dist",
    "build",
    "coverage",
}

# Limites por extensão (linhas) — FONTE CANÔNICA
# Manter sincronizado com .context/AI-GOVERNANCE.md
LIMITS: dict[str, int] = {
    ".py": 400,
    ".tsx": 400,
    ".ts": 400,
    ".jsx": 400,
    ".js": 400,
}

# Arquivos específicos com limite diferente (exceções documentadas)
SPECIFIC_LIMITS: dict[str, int] = {
    "frontend/lib/constants.ts": 500,
    "backend/shared/database/models.py": 600,  # governance-exception: file-length — débito técnico documentado, refatoração pendente
}

EXCEPTION_PATTERN = re.compile(
    r"governance-exception:\s*file-length\s+reason=\"([^\"]+)\""
)


def should_ignore(path: Path, root: Path) -> bool:
    """Verifica se o path deve ser ignorado."""
    rel = path.relative_to(root)
    for part in rel.parts:
        if part in IGNORE_DIRS:
            return True
    return False


def get_limit(path: Path, root: Path) -> int | None:
    """Retorna o limite de linhas para o arquivo, ou None se não se aplica."""
    rel_path = str(path.relative_to(root))

    # Verificar limite específico primeiro
    if rel_path in SPECIFIC_LIMITS:
        return SPECIFIC_LIMITS[rel_path]

    return LIMITS.get(path.suffix)


def has_exception(path: Path) -> str | None:
    """Verifica se o arquivo tem exception metadata (primeiras 5 linhas)."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for i, line in enumerate(f):
                if i >= 5:
                    break
                match = EXCEPTION_PATTERN.search(line)
                if match:
                    return match.group(1)
    except Exception:
        pass
    return None


def count_lines(path: Path) -> int:
    """Conta linhas do arquivo."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def main() -> int:
    root = Path(__file__).parent.parent.resolve()

    violations: list[tuple[str, int, int, str | None]] = []  # (path, lines, limit, reason)

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_ignore(path, root):
            continue

        limit = get_limit(path, root)
        if limit is None:
            continue

        lines = count_lines(path)
        if lines <= limit:
            continue

        rel_path = str(path.relative_to(root))
        exception_reason = has_exception(path)
        violations.append((rel_path, lines, limit, exception_reason))

    # Relatório
    if not violations:
        print("✅ Todos os arquivos dentro dos limites de tamanho.")
        return 0

    # Separar violações com e sem exception metadata
    with_exception = [
        (fp, ln, lm, rs) for fp, ln, lm, rs in violations if rs
    ]
    without_exception = [
        (fp, ln, lm, rs) for fp, ln, lm, rs in violations if not rs
    ]

    if with_exception:
        print("❌ Débito técnico documentado (exception metadata NÃO isenta do gate):")
        for rel_path, lines, limit, reason in sorted(with_exception):
            print(f"   {rel_path}: {lines} linhas (limite: {limit}) [débito: {reason}]")
        print()

    if without_exception:
        print("❌ Violações sem documentação:")
        for rel_path, lines, limit, _ in sorted(without_exception):
            print(f"   {rel_path}: {lines} linhas (limite: {limit})")
        print()

    # Resumo com estatísticas
    total = len(violations)
    max_violation = max(violations, key=lambda v: v[1] - v[2])
    excess = max_violation[1] - max_violation[2]
    print(
        f"Total: {total} arquivo(s) acima do limite. "
        f"Maior excesso: {max_violation[0]} (+{excess} linhas). "
        f"Refatore antes de prosseguir."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
