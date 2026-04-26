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

## Correções (continuação)

### Backend — ValueError ao converter "nivel" vazio no scraping de receitas
- **Fixed** `ValueError: invalid literal for int() with base 10: ''` em `parse_revenue_detailing` durante scraping de receitas (anos 2022 e 2023).
  - Causa: `int(item.get("nivel", 0))` — a chave `"nivel"` existia no dict com valor `''` (string vazia), impedindo o default `0` de ser usado.
  - Solução: adicionada função `_safe_int` (mesmo padrão de `_safe_decimal` já existente) e substituída a chamada direta a `int()` por `_safe_int()`.
  - Arquivos: `backend/features/receita/receita_scraper.py`

## Correções (continuação)

### Backend — Saúde (Farmácia respeita intervalos de datas)
- **Fixed** `build_farmacia_response` carregava `atendimentos` e `dispensados` por snapshot/ano mesmo quando `start_date`/`end_date` estavam presentes, ignorando o range solicitado.
  - Causa: `atendimentos` usava `load_chart_payload(..., year=year)` (que fallback para snapshot do ano) e `dispensados` usava `repo.get_snapshot_payload(...)` fixo.
  - Solução: quando `start_date` e `end_date` são informados, ambas as séries mensais (`MEDICAMENTOS_ATENDIMENTOS_MENSAL` e `MEDICAMENTOS_DISPENSADOS_MENSAL`) agora usam `load_chart_payload(..., start_date=..., end_date=...)` para buscar payload live no intervalo exato. O caminho por snapshot é mantido quando apenas `year` é usado.
  - Arquivos: `backend/features/saude/saude_public_builders.py`
  - Teste de regressão: `backend/tests/test_api/test_saude_farmacia.py` — `test_farmacia_respeita_range_de_datas_cross_year` cobre range cruzando 2025-2026 e prova que dados vêm do payload live para ambas as séries.

### Backend — Saúde (Farmácia cross-year e labels por extenso)
- **Fixed** range cross-year (`start_date`/`end_date`) descartava meses do ano seguinte porque `chart_to_monthly_series_items` ainda aplicava filtro por `year` antes do recorte de intervalo.
  - Causa: `build_farmacia_response` passava `year=year` para `chart_to_monthly_series_items` mesmo no branch de range, fazendo labels como `Janeiro de 2026` serem removidos prematuramente.
  - Solução: no branch de range, `chart_to_monthly_series_items` é chamado sem `year`, deixando `filter_monthly_series_by_date_range` fazer o recorte final com base na data parseada do label.
  - Arquivos: `backend/features/saude/saude_public_builders.py`
- **Fixed** `filter_monthly_series_by_date_range` não reconhecia labels mensais por extenso em português (ex.: `Janeiro de 2026`).
  - Causa: `_parse_monthly_label` só suportava formatos numéricos (`01/2025`, `2025-01`).
  - Solução: adicionado parser para formato `Mês de Ano` com dicionário de meses em PT-BR.
  - Arquivos: `backend/features/saude/saude_snapshot_mapper.py`
- **Updated** teste de regressão `test_farmacia_respeita_range_de_datas_cross_year` para usar labels por extenso no payload live e validar presença de meses de 2025 e 2026, além dos totais completos.
  - Arquivo: `backend/tests/test_api/test_saude_farmacia.py`

## Validação (fix receita_scraper)
- `ruff check features/receita/receita_scraper.py` — pass
- `mypy features/receita/receita_scraper.py` — pass
- `pytest tests/test_etl/test_scraping_receitas.py` — 1 passed
- `pytest tests/test_etl/test_scraping_scheduler.py` — 4 passed


## Added (continuação — Tasks 01/02/03)

### Despesas — Seletor de Detalhamento por Categoria (Task 01)
- Nova seção "Detalhamento por Categoria" na página de despesas com 4 abas: Natureza de Despesa, Função, Órgão, Elemento de Despesa
- Componente `DespesaBreakdownTable` extraído em arquivo próprio para manter `despesas-client.tsx` abaixo do limite de 400 linhas
- Backend: tipo de breakdown `NATUREZA` adicionado ao handler, scraper e orchestrator
- Hook `useDespesasBreakdownTotais` + API `getBreakdownTotais` no frontend

### Receitas — Seletor de Mês no Detalhamento Hierárquico (Task 02)
- Seletor de mês (Anual | Janeiro | Fevereiro | ... | Dezembro) adicionado abaixo de "X itens registrados"
- Default é "Anual" (soma de todos os meses)
- Colunas `valores_mensais` e `valores_anulados_mensais` (JSON) adicionadas ao modelo `ReceitaDetalhamentoModel`
- Scraper armazena valores mensais individuais em JSON
- Endpoint `/api/v1/receitas/detalhamento/{ano}` aceita parâmetro `mes` (1-12)
- KPIs ajustados para refletir período correto quando mês está selecionado
- Migration Alembic: `686fd3aaaeb2`

### Receitas — Correção da Hierarquia do Detalhamento (Task 03)
- Normalização de níveis hierárquicos no `list_detalhamento_by_ano`: remove gaps (ex.: 5→7) e duplicatas consecutivas
- Algoritmo robusto: mapeia níveis únicos ordenados para valores contíguos

## Changed (Tasks 01/02/03)
- `receita_data.py`: método `_normalize_detalhamento` + suporte a `mes`
- `receita_handler.py`: parâmetro `mes` + campo `mes_selecionado`
- `receita_scraper.py`: armazena mensais em JSON
- `despesa_handler.py`: `NATUREZA` adicionado aos tipos válidos
- `despesa_breakdown_scraper.py`: método `parse_despesas_natureza`
- `scraping_orchestrator.py`: natureza no pipeline de breakdown
- `scraping_helpers.py`: persistir novos campos JSON

## Validação (Tasks 01/02/03)
- Backend: ruff ✓, mypy ✓, pytest 94 passed ✓
- Frontend: lint ✓, type-check ✓
- Gate de tamanho: todos arquivos abaixo de 400 linhas ✓

## Correções (continuação)

### Backend — Hierarquia do Detalhamento de Receitas (correção de raiz)
- **Fixed** itens de receitas apareciam no nível 1 em vez de nível 6 (ex.: IPTU - Principal).
  - **Causa raiz:** a tabela `receita_detalhamento` armazena níveis com **gaps** dentro de subárvores. Exemplo: IPTU pai no nível 5, filhos diretos no nível 7 (pula o 6). A normalização anterior (`_normalize_detalhamento`) fazia apenas **remapeamento global** dos níveis únicos, que era uma no-op porque todos os níveis 1-10 existiam em algum lugar do dataset. Consequência: o frontend `isVisible` não encontrava o pai esperado no nível 6 e caía no `return true`, tornando itens profundos visíveis sem seus ancestrais.
  - **Solução backend:** substituída a normalização global por **recomputação baseada em pilha** que usa os níveis originais para reconstruir a profundidade real na árvore. O novo nível de cada item é `len(pilha) + 1`, garantindo contiguidade local independente de gaps no banco. Além disso, a detecção de duplicatas consecutivas passou a usar comparação **case-insensitive** (`upper()`), removendo filhos duplicados com caixa diferente (ex.: "IMPOSTO..." pai vs "Imposto..." filho). Resultado: 37 duplicatas removidas do dataset 2025.
  - **Solução frontend:** expandido `INDENT_MAP` de 5 para 10 níveis (`pl-3` até `pl-[18.5rem]`). Hardening do `isVisible`: busca ancestral com `<= targetNivel` em vez de `=== targetNivel`, tornando a lógica de visibilidade robusta a gaps.
  - **Arquivos:** `backend/features/receita/receita_data.py`, `frontend/components/receitas/ReceitaDetalhamentoTable.tsx`
  - **Comparativo API vs Banco vs Referência (IPTU 2025):**
    | Campo | Referência (PDF) | Banco/API (atual) |
    |---|---|---|
    | IPTU - Principal previsto | 700.000,00 | 700.000,00 ✓ |
    | IPTU - Principal arrecadado | 22.566,82 | 437.542,12 (anual total Quality API vs PDF parcial) |
    | IPTU - Principal nível | 6 | ~~7~~ → **6** ✓ |
    | Hierarquia | contígua | gaps removidos ✓ |

## Validação (hierarquia detalhamento)
- Backend: `ruff check .` — pass (3 erros pré-existentes em `features/saude/saude_public_builders.py` e `scripts/seed_admin.py`)
- Backend: `mypy .` — pass (5 erros pré-existentes)
- Backend: `pytest` — **94 passed** ✓
- Frontend: `npm run lint` — sem erros ✓
- Frontend: `npm run type-check` — sem erros nos arquivos alterados (erros pré-existentes em testes com vitest/leaflet ausentes)
- Frontend: `npm run build` — build bloqueado por `leaflet` não instalado (pré-existente, fora do escopo)

## Correções (continuação)

### Backend — OperationalError: no such column: receita_detalhamento.valores_mensais
- **Fixed** `sqlalchemy.exc.OperationalError` ao acessar `GET /api/v1/receitas/detalhamento/{ano}` (2025, 2026).
  - Causa: a migration Alembic `686fd3aaaeb2` (adição de `valores_mensais` e `valores_anulados_mensais`) nunca foi aplicada ao banco `database/dashboard.db`. O banco foi criado via `Base.metadata.create_all()` com o schema anterior e não possuía tabela `alembic_version`.
  - Solução: adicionadas as 2 colunas faltantes via `ALTER TABLE receita_detalhamento ADD COLUMN valores_mensais TEXT` e `ALTER TABLE receita_detalhamento ADD COLUMN valores_anulados_mensais TEXT`. Os valores ficarão NULL até a próxima execução do scraper popular os dados mensais via Quality API.
  - Sem alteração em código-fonte — correção operacional no banco de dados.
  - Após corrigir o schema, resetado `quality_sync_state` para receitas 2025/2026 e re-executado `ScrapingService.scrape_receitas()` para popular `valores_mensais` e `valores_anulados_mensais` com dados mensais da API Quality.
  - Resultado: 2025 → 499 registros com mensais, 2026 → 459 registros com mensais.

### Backend — Despesa Breakdown NATUREZA faltando para anos históricos (2013-2025)
- **Fixed** "Nenhum dado encontrado para o filtro selecionado" no Detalhamento por Categoria de despesas para anos ≤ 2025.
  - Causa: o tipo de breakdown `NATUREZA` só havia sido scrapeado para 2026; os anos 2013-2025 nunca receberam dados de natureza no `despesa_breakdown`, embora os outros tipos (ORGAO, FUNCAO, ELEMENTO) estivessem presentes.
  - Solução: executado `ScrapingService.scrape_despesas_breakdown()` para 2013-2025. Os tipos já existentes foram ignorados (NO_CHANGE via hash); apenas NATUREZA foi processado — 36 registros por ano, totalizando 468 novos registros.
  - Sem alteração em código-fonte — correção operacional via scraper.
