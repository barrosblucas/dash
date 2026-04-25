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
