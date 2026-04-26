# Changelog 2026-04-26

## Correções

### Backend — Saúde (Bootstrap histórico e deduplicação de snapshots)
- **Fixed** ausência de dados históricos (2016–2024) no item farmácia e demais recursos year-scoped da feature saúde.
  - Causa raiz 1: `SaudeSyncService._resolve_years` limitava o sync automático a apenas `[current_year, current_year - 1]`. O scheduler nunca buscava anos históricos.
  - Causa raiz 2: Não existia mecanismo de bootstrap histórico para snapshots de saúde (diferente de receitas/despesas que usam PDFs).
  - Causa raiz 3: `SQLSaudeRepository.replace_snapshot` sempre inseria um novo registro no banco, mesmo quando o payload era idêntico ao existente, causando inflação da tabela `saude_snapshots` (16 registros por combinação resource+ano).
  - Solução:
    1. Criado `SaudeHistoricalBootstrapService` em `backend/features/saude/saude_historical_bootstrap.py` que detecta anos faltantes no banco para recursos year-scoped e os sincroniza via `SaudeSyncService` com trigger type `BOOTSTRAP`.
    2. Integrado o bootstrap no startup (`api/main.py lifespan`), executando de forma idempotente após o bootstrap de receitas/despesas.
    3. Modificado `replace_snapshot` para comparar o payload canonicamente (via `json.dumps` com `sort_keys=True`) antes de inserir. Se o payload for idêntico ao mais recente, retorna o existente sem criar novo registro.
    4. Adicionado `BOOTSTRAP` ao enum `SaudeSyncTriggerType` para rastreabilidade.
  - Arquivos modificados:
    - `backend/features/saude/saude_data.py` — deduplicação no `replace_snapshot`
    - `backend/features/saude/saude_types.py` — novo trigger type `BOOTSTRAP`
    - `backend/features/saude/saude_historical_bootstrap.py` — novo serviço de bootstrap
    - `backend/api/main.py` — integração no lifespan
    - `backend/tests/conftest.py` — mock do bootstrap para testes de integração
    - `backend/pyproject.toml` — exclui `scripts/` do mypy (erro pré-existente em `seed_admin.py`)
  - Testes criados: `backend/tests/test_etl/test_saude_historical_bootstrap.py` (7 casos: deduplicação com payload idêntico, deduplicação com payload diferente, inserção quando não existe, bootstrap não executa quando não há anos faltantes, bootstrap executa sync para anos faltantes, bootstrap registra warnings em erros, coleta de anos faltantes respeita anos existentes)

## Validação
- `pytest tests/test_etl/test_saude_historical_bootstrap.py` — 7/7 pass
- `pytest tests/test_api/test_saude_dashboards.py` — pass
- `pytest tests/` (suite completa) — 89 pass, 0 fail
- `ruff check .` — pass
- `mypy .` — pass
