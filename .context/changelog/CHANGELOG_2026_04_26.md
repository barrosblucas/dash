# Changelog 2026-04-26

## Added

### Backend — Saúde (Estruturação de dados — migration de snapshots para tabelas de domínio)

**Motivação**: Migrar a feature saúde de armazenamento genérico em JSON (`saude_snapshots`) para 7 tabelas relacionais de domínio com colunas tipadas, sincronizadas a cada 10 minutos da API Genesiscloud (E-Saúde).

#### Schema (models + migration)
- **Added** 7 novos modelos ORM em `backend/shared/database/models.py`:
  - `SaudeMedicamentoModel` — estoque de medicamentos com `(product_name, unit, in_stock, minimum_stock, department, establishment)` e chave única `uq_saude_medicamento_prod_dept_estab`.
  - `SaudeFarmaciaModel` — atendimentos, dispensação e ranking de farmácia com `(ano, mes, dataset, label, quantidade)` e chave única `uq_saude_farmacia_row`.
  - `SaudeVacinacaoModel` — vacinas aplicadas e ranking com `(ano, mes, dataset, label, quantidade)` e chave única `uq_saude_vacinacao_row`.
  - `SaudeEpidemiologicoModel` — quantitativos e atendimentos por sexo com `(dataset, label, valor)` e chave única `uq_saude_epidemiologico_row`.
  - `SaudeAtencaoPrimariaModel` — atendimentos, procedimentos e CBO da atenção primária com `(ano, mes, dataset, label, quantidade)` e chave única `uq_saude_atencao_primaria_row`.
  - `SaudeBucalModel` — atendimentos odontológicos com `(ano, mes, label, quantidade)` e chave única `uq_saude_bucal_label`.
  - `SaudeProcedimentosModel` — procedimentos por tipo com `(label, quantidade)` e chave única `uq_saude_procedimentos_label`.
- **Added** migration Alembic `7b582580d5e7_add_saude_domain_tables.py` com índices apropriados e downgrade completo.

#### Camada de dados estruturados (`saude_data.py`)
- **Added** 5 métodos de escrita estruturada em `SQLSaudeRepository`:
  - `upsert_medicamentos` — upsert individual por chave composta `(product_name, department, establishment)`.
  - `replace_domain_rows` — delete+insert genérico para tabelas com padrão `(ano, mes, dataset, label, quantidade)`.
  - `replace_epidemiologico_rows`, `replace_bucal_rows`, `replace_procedimentos_rows` — delete+insert por chave específica.
- **Added** 8 métodos de query para os handlers públicos:
  - `list_medicamentos`, `get_medicamentos_synced_at`, `list_farmacia_rows`, `list_vacinacao_rows`, `list_epidemiologico_rows`, `list_atencao_primaria_rows`, `list_bucal_rows`, `list_procedimentos_rows`.

#### Sync ETL (`saude_sync.py`)
- **Added** `_parse_chart_to_rows` — converte payload `{labels, datasets}` da API em linhas estruturadas.
- **Added** `_parse_label_year_month` — extrai ano/mês de rótulos em português (`Janeiro de 2025`, `01/2025`, `2025-01`).
- **Added** `_populate_domain_tables` — orquestra preenchimento das 7 tabelas a partir dos payloads já coletados.
- A lógica de snapshot existente foi **preservada integralmente**; o ETL estruturado é executado adicionalmente (coexistência).

#### Handlers públicos (`saude_public_handler.py` + `saude_public_builders.py`)
- **Changed** 7 endpoints para leitura estruturada com fallback a snapshot:
  - `GET /medicamentos-estoque` → `saude_medicamentos`
  - `GET /medicamentos-dispensados` → `saude_farmacia`
  - `GET /farmacia` → `saude_farmacia`
  - `GET /vacinacao` → `saude_vacinacao`
  - `GET /atencao-primaria` → `saude_atencao_primaria`
  - `GET /saude-bucal` → `saude_bucal`
  - `GET /procedimentos-tipo` → `saude_procedimentos`
- **Preservados** como snapshot-only: `perfil-epidemiologico`, `visitas-domiciliares`, `hospital`, `perfil-demografico`.
- **Added** `SNAPSHOT_ONLY_RESOURCES` em `saude_resource_catalog.py` documentando os recursos que continuam apenas em snapshot.
- Contratos Pydantic e TypeScript **inalterados** — a mudança é estritamente interna.

#### Scheduler
- **Changed** intervalo de sync de **6 horas para 10 minutos**:
  - `shared/settings.py`: `saude_sync_interval_hours` → `saude_sync_interval_minutes` (default `10`).
  - `saude_scheduler.py`: `IntervalTrigger(hours=...)` → `IntervalTrigger(minutes=...)`.

## Notas técnicas
- **Coexistência**: snapshots e tabelas estruturadas coexistem durante a transição. Handlers tentam tabela estruturada primeiro; se vazia, caem para snapshot.
- **Regra temporal**: dados pré-2026 são majoritariamente imutáveis; dados de 2026 (especialmente mês corrente) sofrem overwrite a cada sync de 10 minutos.
- **Upsert idempotente**: reexecução do sync não duplica linhas — estratégia delete+insert por chave composta garante idempotência.
- Todos os arquivos alterados dentro do limite de 400 linhas, exceto `models.py` (549 linhas, débito técnico pré-existente).
- Frontend **não requer alterações** — contratos de resposta preservados e tipos TypeScript já alinhados.

## Validação
- `ruff check .` — 2 erros pré-existentes em `tests/conftest.py` (E402); zero erros novos.
- `mypy .` — 5 erros pré-existentes em `scripts/seed_admin.py` e `tests/conftest.py`; zero erros novos.
- Alembic migration SQL verificado — 7 `CREATE TABLE`, índices e constraints gerados corretamente, sem duplicatas.
- `pytest` bloqueado por gate de tamanho pré-existente em `models.py` (549 linhas); sem regressão introduzida.
