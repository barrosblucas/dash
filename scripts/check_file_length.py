#!/usr/bin/env python3
"""
Gate: Check de tamanho de arquivo.

Bloqueia arquivos que excedem o hard limit de linhas.
Arquivos fora do limite devem ser refatorados antes do merge.

Uso:
    python scripts/check_file_length.py [--baseline BASELINE_FILE]

Exit codes:
    0: todos os arquivos dentro do limite
    1: um ou mais arquivos excederam o limite

Exception metadata (comentar no arquivo):
    # governance-exception: file-length reason="..." ticket="..."
"""

import argparse
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
    "dist",
    "build",
    "coverage",
    ".pytest_cache",
}

# Limites por extensão (linhas)
LIMITS = {
    ".py": 400,
    ".tsx": 300,
    ".ts": 300,
    ".jsx": 300,
    ".js": 300,
}

# Arquivos específicos com limite diferente
SPECIFIC_LIMITS: dict[str, int] = {
    # Constantes e configs tendem a ser maiores
    "frontend/lib/constants.ts": 500,
}

EXCEPTION_PATTERN = re.compile(
    r"governance-exception:\s*file-length\s+reason=\"([^\"]+)\""
)


def should_ignore(path: Path, root: Path) -> bool:
    """Verifica se o path deve ser ignorado."""
    rel = path.relative_to(root)
    parts = rel.parts
    for part in parts:
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


def load_baseline(baseline_file: Path | None) -> set[str]:
    """Carrega baseline de arquivos já conhecidos como grandes."""
    if not baseline_file or not baseline_file.exists():
        return set()
    with open(baseline_file, "r", encoding="utf-8") as f:
        return {line.strip() for line in f if line.strip()}


def main() -> int:
    parser = argparse.ArgumentParser(description="Check de tamanho de arquivo")
    parser.add_argument(
        "--baseline",
        type=Path,
        default=None,
        help="Arquivo com lista de paths conhecidos (um por linha) a ignorar",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).parent.parent,
        help="Diretório raiz do projeto",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    baseline = load_baseline(args.baseline)

    violations: list[tuple[str, int, int]] = []  # (path, lines, limit)
    warnings: list[tuple[str, int, int, str]] = []  # path, lines, limit, reason

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_ignore(path, root):
            continue

        limit = get_limit(path, root)
        if limit is None:
            continue

        rel_path = str(path.relative_to(root))

        # Arquivos na baseline são apenas avisados
        if rel_path in baseline:
            lines = count_lines(path)
            if lines > limit:
                warnings.append((rel_path, lines, limit, "baseline"))
            continue

        # Arquivos com exception metadata são avisados
        exception_reason = has_exception(path)
        if exception_reason:
            lines = count_lines(path)
            if lines > limit:
                warnings.append((rel_path, lines, limit, exception_reason))
            continue

        lines = count_lines(path)
        if lines > limit:
            violations.append((rel_path, lines, limit))

    # Relatório
    if warnings:
        print("⚠️  Arquivos acima do limite (baseline/exception — não bloqueiam):")
        for rel_path, lines, limit, reason in sorted(warnings):
            print(f"   {rel_path}: {lines} linhas (limite: {limit}) [{reason}]")
        print()

    if violations:
        print("❌ Arquivos acima do hard limit (bloqueiam):")
        for rel_path, lines, limit in sorted(violations):
            print(f"   {rel_path}: {lines} linhas (limite: {limit})")
        print()
        print(f"Total: {len(violations)} violações. Refatore antes de prosseguir.")
        return 1

    print(f"✅ Todos os arquivos dentro dos limites de tamanho.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
