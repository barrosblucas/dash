# Changelog 2026-04-25

## Correções

### Backend — Scraping
- **Fixed** `sqlite3.OperationalError: database is locked` durante execução do job agendado de scraping.
  - Causa: `_create_log` abria uma sessão SQLAlchemy própria, fazia `flush()` + `commit()` e retornava o objeto detached; em seguida a transação principal de dados abria outra sessão, gerando contenção no SQLite sob concorrência entre scheduler e requisições da API.
  - Solução: `_create_log` agora recebe `session: Session` e insere o log na mesma sessão da transação de dados. Callers (`scrape_receitas`, `scrape_despesas`) foram ajustados para criar o log dentro do bloco `with db_manager.get_session()`.
  - Arquivos: `backend/features/scraping/scraping_helpers.py`, `backend/features/scraping/scraping_orchestrator.py`
  - Testes ajustados: `backend/tests/test_etl/test_scraping_receitas.py`, `backend/tests/test_etl/test_scraping_despesas.py`, `backend/tests/test_etl/conftest.py`

### Backend — Saúde (Integração E-Saúde)
- **Fixed** ruído de erro HTTP 404 no sync agendado de saúde causado por endpoint obsoleto.
  - Causa: `quantidade-de-atendimento-por-sexo` retorna 404 permanentemente no servidor remoto, mas estava incluído em `DEFAULT_SYNC_RESOURCES`.
  - Solução: removido `SaudeSnapshotResource.ATENDIMENTOS_POR_SEXO` de `DEFAULT_SYNC_RESOURCES` em `backend/features/saude/saude_resource_catalog.py`. O recurso permanece no catálogo e na API pública para compatibilidade; a rota `/perfil-epidemiologico` já possui fallback para `quantitativos` quando o snapshot não existe.
  - Testes ajustados: `backend/tests/test_api/test_saude_dashboards.py` (lista de recursos do sync e assertion de snapshots).

## Validação
- `pytest tests/test_etl/test_scraping_receitas.py` — pass
- `pytest tests/test_etl/test_scraping_despesas.py` — pass
- `pytest tests/test_api/test_saude_dashboards.py` — pass
- `pytest tests/` (restante) — pass
- `ruff check .` — 1 erro pré-existente em `features/saude/saude_public_builders.py` (F401, fora do escopo)
- `mypy .` — 4 erros pré-existentes em `scripts/seed_admin.py` (fora do escopo)


## Correções (continuação)

### Backend — SQLite database locked (causa raiz)
- **Fixed** `sqlite3.OperationalError: database is locked` durante scraping causado por transação longa no scheduler de saúde.
  - Causa: `SaudeSyncService.sync` mantinha a sessão SQLAlchemy aberta durante chamadas HTTP async (`await fetch_resource_payload`), segurando o write lock do SQLite por potencialmente minutos. Quando o `ScrapingScheduler` iniciava e tentava `DELETE FROM receitas`, encontrava o banco bloqueado.
  - Solução: refatorado `saude_sync.py` para coletar TODOS os payloads via I/O async ANTES de abrir a transação de persistência. A transação de banco agora contém apenas operações de repo (create_sync_log, replace_snapshot, update_sync_log) sem `await` no meio, reduzindo drasticamente o tempo de lock.
  - Arquivos: `backend/features/saude/saude_sync.py`
  - Testes criados: `backend/tests/test_etl/test_saude_sync.py` (4 casos: coleta antes de persistir, sync parcial, erro total, persistência de logs)

### Backend — Configuração SQLite
- **Changed** `backend/shared/database/connection.py` — avaliado e removido `BEGIN IMMEDIATE` via evento `begin` após evidência de que aumentava contenção em leituras concorrentes. Mantido WAL mode, `check_same_thread=False` e `timeout=60` como configuração base.

## Validação (atualizada)
- `pytest tests/test_etl/test_saude_sync.py` — 4/4 pass
- `pytest tests/test_etl/test_scraping_receitas.py` — pass
- `pytest tests/test_etl/test_scraping_despesas.py` — pass
- `pytest tests/test_api/test_identity.py` — pass
- `pytest tests/` (suite completa) — 89 pass, 0 fail
- `ruff check features/saude/saude_sync.py shared/database/connection.py tests/test_etl/test_saude_sync.py` — pass
- `mypy features/saude/saude_sync.py shared/database/connection.py tests/test_etl/test_saude_sync.py` — pass
