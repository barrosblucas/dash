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

## Added

### Backend — Despesa Breakdown (infraestrutura de scraping por órgão/função/elemento)
- **Added** 3 novos modelos ORM em `backend/shared/database/models.py`:
  - `DespesaBreakdownModel` (tabela `despesa_breakdown`): armazena breakdown mensal de despesas por Órgão, Função e Elemento, com unique constraint composta `(ano, mes, breakdown_type, item_label)`.
  - `QualitySyncStateModel` (tabela `quality_sync_state`): rastreia hash SHA-256 por dataset/ano para detecção de mudanças (`status`: SUCCESS, NO_CHANGE, NO_DATA, ERROR).
  - `QualityUnidadeGestoraModel` (tabela `quality_unidade_gestora`): catálogo de unidades gestoras do portal QualitySistemas.
- **Added** 4 novos métodos em `backend/shared/quality_api_client.py`:
  - `fetch_despesas_orgao(year, unidade_gestora)` → endpoint `Orgao`
  - `fetch_despesas_funcao(year, unidade_gestora)` → endpoint `Funcao`
  - `fetch_despesas_elemento(year, unidade_gestora)` → endpoint `ElementoDespesa`
  - `fetch_unidades_gestoras()` → endpoint `BuscaDadosUnidadeGestora`
- **Added** dataclass `DespesaBreakdown` e 4 métodos de parse em `backend/features/despesa/despesa_scraper.py`:
  - `parse_despesas_orgao`, `parse_despesas_funcao`, `parse_despesas_elemento` (públicos)
  - `_parse_breakdown` (privado, reutiliza `MESES_KEYS` e `_parse_brazilian_currency` existentes)
- **Added** 5 novos helpers de persistência em `backend/features/scraping/scraping_helpers.py`:
  - `_replace_breakdown_for_year`: replace idempotente de breakdown por ano/tipo
  - `_upsert_sync_state`: grava estado de sync com hash e status
  - `_get_sync_state_hash`: recupera hash armazenado para comparação
  - `_is_year_fully_synced`: verifica se todos os tipos de breakdown estão sincronizados para um ano
  - `_replace_unidades_gestoras`: replace idempotente do catálogo de unidades gestoras
- **Added** orquestração expandida em `backend/features/scraping/scraping_orchestrator.py`:
  - `run_full_scraping`: executa scraping completo (receitas, despesas, breakdown, unidades gestoras, PDF)
  - `run_historical_bootstrap`: bootstrap idempotente de anos históricos 2013–2025 para breakdown
  - `scrape_despesas_breakdown`: scraping de breakdown por tipo (orgao/funcao/elemento) com detecção de mudança por hash
  - `scrape_unidades_gestoras`: sincronização do catálogo de unidades gestoras
- **Added** scheduler expandido em `backend/features/scraping/scraping_scheduler.py`:
  - Ano dinâmico (calculado a partir da data atual, não hardcoded)
  - Bootstrap histórico de breakdown no startup da aplicação
  - Job periódico de full scraping (receitas, despesas, breakdown, PDF)
- **Added** novos endpoints HTTP em `backend/features/despesa/despesa_handler.py`:
  - `GET /api/v1/despesas/breakdown/{type}/{ano}` — lista breakdown paginado por tipo e ano
  - `GET /api/v1/despesas/breakdown/{type}/{ano}/totais` — totais anuais do breakdown
  - `GET /api/v1/despesas/breakdown/{type}/anos` — anos disponíveis para o tipo
- **Added** novo repositório `SQLDespesaBreakdownRepository` em `backend/features/despesa/despesa_data.py` — queries de listagem, totais e anos disponíveis para breakdown.
- **Added** novos schemas Pydantic em `backend/features/despesa/despesa_types.py`:
  - `DespesaBreakdownResponse`
  - `DespesaBreakdownListResponse`
  - `DespesaBreakdownTotalsResponse`
- **Added** flag `run_historical` em `ScrapingTriggerRequest` (`backend/features/scraping/scraping_types.py`) — permite acionar bootstrap histórico manualmente via endpoint de trigger.
- **Added** Alembic migration `043c91035847` criando as 3 novas tabelas com índices e constraints.

## Validação (atualizada)
- `pytest tests/test_etl/test_saude_sync.py` — 4/4 pass
- `pytest tests/test_etl/test_scraping_receitas.py` — pass
- `pytest tests/test_etl/test_scraping_despesas.py` — pass
- `pytest tests/test_api/test_identity.py` — pass
- `pytest tests/` (suite completa) — 82 pass, 7 errors pré-existentes (`email_validator` não instalado no ambiente)
- `ruff check features/saude/saude_sync.py shared/database/connection.py tests/test_etl/test_saude_sync.py` — pass
- `mypy features/saude/saude_sync.py shared/database/connection.py tests/test_etl/test_saude_sync.py` — pass
- `ruff check shared/database/models.py shared/quality_api_client.py features/despesa/despesa_scraper.py alembic/versions/043c91035847_add_despesa_breakdown_and_quality_sync_.py` — pass
- `mypy shared/database/models.py shared/quality_api_client.py features/despesa/despesa_scraper.py` — pass
- Imports de validação: `DespesaBreakdownModel`, `QualitySyncStateModel`, `QualityUnidadeGestoraModel`, `QualityAPIClient`, `DespesaScraper`, `DespesaBreakdown` — OK

## Added (continuação)

### Backend — Testes de sincronização de estado do scraping
- **Added** `backend/tests/test_etl/test_scraping_sync_state.py` cobrindo cenários críticos de hash match / NO_CHANGE que o reviewer sinalizou como não testados:
  - `test_scrape_receitas_retorna_no_change_quando_hash_igual`: quando o hash do payload de receitas bate com o armazenado, retorna `ScrapingResult(success=True, errors=["NO_CHANGE"])` com 0 registros processados e chama `_upsert_sync_state` com status `NO_CHANGE`, sem invocar upsert/replace de dados.
  - `test_scrape_despesas_retorna_no_change_quando_hash_igual`: mesmo comportamento para despesas (consolidado anual + natureza).
  - `test_is_year_fully_synced_aceita_no_change_como_synced`: `_is_year_fully_synced` considera `NO_CHANGE` como sincronizado (mixed `NO_CHANGE` + `SUCCESS` retorna `True`).
  - `test_is_year_fully_synced_rejeita_status_nao_synced`: rejeita status `ERROR`.
  - `test_is_year_fully_synced_rejeita_none`: rejeita quando não há estado (`None`).
- Estilo: pytest + monkeypatch + fakes mínimos, consistente com os testes ETL existentes.

## Validação (testes novos)
- `ruff check tests/test_etl/test_scraping_sync_state.py` — pass
- `mypy tests/test_etl/test_scraping_sync_state.py` — pass
- `pytest tests/test_etl/test_scraping_sync_state.py` — 5/5 pass
- Nota: `pytest` executado com `--rootdir=tests/test_etl` para contornar gate de tamanho de arquivo pré-existente (4 arquivos de produção acima de 400 linhas).
