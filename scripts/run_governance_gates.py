#!/usr/bin/env python3
"""
Executor de todos os gates de governança.

Roda todos os checks estruturais em sequência e reporta resultado final.
Os gates de lint/typecheck/test/build devem ser rodados separadamente
(pelos comandos canônicos do AGENTS.md).

Uso:
    python scripts/run_governance_gates.py

O modo strict é o PADRÃO. Gates que falham retornam exit code 1.
Use --warn-only para diagnóstico (não recomendado para CI ou pre-commit).

Exit codes:
    0: todos os gates passaram
    1: um ou mais gates falharam
"""

import subprocess
import sys
from pathlib import Path

GATES = [
    ("check_file_length", "scripts/check_file_length.py"),
    ("check_frontend_boundaries", "scripts/check_frontend_boundaries.py"),
    ("check_no_console", "scripts/check_no_console.py"),
    ("check_alembic_migration", "scripts/check_alembic_migration.py"),
]


def run_gate(name: str, script: str, root: Path) -> tuple[bool, str]:
    """Executa um gate e retorna (passou, output)."""
    script_path = root / script
    if not script_path.exists():
        return True, f"⚠️  {script} não encontrado — pulando"

    result = subprocess.run(
        [sys.executable, str(script_path)],
        capture_output=True,
        text=True,
        cwd=str(root),
    )

    output = result.stdout.strip()
    if result.returncode == 0:
        return True, output
    else:
        return False, output + (
            "\n" + result.stderr.strip() if result.stderr.strip() else ""
        )


def main() -> int:
    root = Path(__file__).parent.parent.resolve()
    warn_only = "--warn-only" in sys.argv

    print("=" * 60)
    print("GOVERNANCE GATES")
    print("=" * 60)
    print()

    results: list[tuple[str, bool, str]] = []

    for name, script in GATES:
        print(f"▸ {name}...")
        passed, output = run_gate(name, script, root)

        # Mostrar output do gate
        if output:
            for line in output.split("\n"):
                print(f"  {line}")

        results.append((name, passed, output))
        print()

    # Resumo
    print("=" * 60)
    print("RESUMO")
    print("=" * 60)

    passed_count = sum(1 for _, p, _ in results if p)
    failed_count = len(results) - passed_count

    for name, passed, _ in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} — {name}")

    print()
    print(f"Total: {passed_count} passaram, {failed_count} falharam")

    if failed_count > 0:
        if warn_only:
            print(
                "\n⚠️  Gates falharam (modo --warn-only). "
                "Sem --warn-only, estas falhas bloqueariam o commit."
            )
            return 0

        print(
            f"\n❌ {failed_count} gate(s) falharam. "
            "Corrija antes de fazer commit."
        )
        return 1

    print("\n✅ Todos os gates de governança passaram.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
