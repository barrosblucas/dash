# CHANGELOG 2026-04-11

## Governança AI-Native do repositório

Criação dos documentos de governança adaptados para a stack dual (Python/FastAPI + Next.js/TypeScript) do Dashboard Financeiro Municipal, mantendo os princípios AI-Native, AI-Coded e LLM-Friendly do repositório de referência.

### Arquivos criados
- `.context/AI-GOVERNANCE.md` — regras canônicas de implementação, qualidade e segurança
- `.context/architecture.md` — visão arquitetural de referência com camadas e fronteiras
- `.context/REPOMAP.md` — mapa da estrutura real do repositório
- `.context/PROJECT_STATE.md` — estado atual do projeto com débito técnico conhecido
- `.context/changelog/CHANGELOG_2026_04_11.md` — este changelog

### Arquivo atualizado
- `AGENTS.md` — fluxo operacional adaptado para a stack dual com comandos de validação corretos

### Conceitos preservados do repositório de referência
- Taxonomia de mudança (`regra_de_negocio`, `borda_externa`, `mudanca_mecanica`)
- Ordem de execução por tipo (test-first, contract-first, same-cycle)
- Gates obrigatórios adaptados para ruff/mypy/pytest + eslint/tsc/build
- Hard rules adaptadas (Pydantic no lugar de Zod, SQLAlchemy no lugar de Prisma)
- Naming convention (inglês técnico, kebab-case/snake_case/PascalCase por contexto)
- Política de testes por função
- Documentação viva obrigatória
- Definition of Done
- Separação de domínio e infraestrutura

---

## CI Gates executáveis

Criação dos scripts de gate de governança que materializam os checks estruturais declarados no AI-GOVERNANCE.md.

### Scripts criados (`scripts/`)
- `check_file_length.py` — bloqueia arquivos acima do hard limit (Python ≤ 400, TS/TSX ≤ 300 linhas)
- `check_frontend_boundaries.py` — bloqueia import de `backend/` no frontend
- `check_no_console.py` — bloqueia `console.*` (TS) e `print()` (Python) em produção
- `check_alembic_migration.py` — exige migration quando `models.py` muda
- `run_governance_gates.py` — runner unificado com flag `--strict`

### Execução
```bash
python scripts/run_governance_gates.py          # warning only
python scripts/run_governance_gates.py --strict  # bloqueia se falhar
```

### Débito técnico identificado pelos gates
- 6 arquivos acima do limite de linhas (refatorar)
- 9 ocorrências de console.log/print em produção (substituir por logger)

---

## Feature-first explícito na governança

Documentação do padrão feature-first (organização por domínio dentro de camadas) no AI-GOVERNANCE.md e architecture.md.

### Atualizado
- `.context/AI-GOVERNANCE.md` — seção Feature-first com regras, padrão backend e frontend
- `.context/architecture.md` — tabela de features atuais e regra de adição de feature
- `.context/REPOMAP.md` — inclusão da seção `scripts/`
