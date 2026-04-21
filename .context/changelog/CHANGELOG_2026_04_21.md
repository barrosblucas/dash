# Changelog — 2026-04-21

## [MAJOR] Migração arquitetural: Layer-First → Vertical Bounded Contexts

### Contexto
O backend foi reestruturado de uma organização layer-first (por camada técnica: `api/`, `domain/`, `infrastructure/`, `services/`, `etl/`) para vertical bounded contexts (por feature: `features/receita/`, `features/despesa/`, etc.).

### Mudança estrutural

#### Novos diretórios criados
- `backend/features/` — 8 bounded contexts verticais
  - `receita/` — tipos, handler, data, scraper
  - `despesa/` — tipos, handler, data, scraper
  - `forecast/` — tipos, handler, business (Prophet)
  - `licitacao/` — tipos, handler
  - `kpi/` — tipos, handler
  - `movimento_extra/` — tipos, handler
  - `scraping/` — tipos, handler, orchestrator, helpers, scheduler, services
  - `export/` — tipos, handler
- `backend/shared/` — infraestrutura compartilhada
  - `database/connection.py` — engine e session manager
  - `database/models.py` — ORM models
  - `pdf_extractor.py` — módulo consolidado (3 arquivos → 1)
  - `quality_api_client.py` — cliente HTTP Quality

#### Arquivos consolidados
- `etl/extractors/pdf_entities.py` + `pdf_parsers.py` + `pdf_extractor.py` → `shared/pdf_extractor.py`

#### Regras arquiteturais por arquivo
- `*_types.py` — sem imports de SQLAlchemy, FastAPI ou Prophet
- `*_business.py` — sem imports de SQLAlchemy, FastAPI ou HTTP
- `*_handler.py` — sem lógica de negócio, apenas delegação
- `*_data.py` — SQL/persistência
- Sem imports cross-feature — features só importam de `shared/`

#### Retrocompatibilidade
- Localizações antigas mantidas temporariamente como re-exports para backward compatibility
- `api/main.py` atualizado para importar dos novos features
- Todos os testes atualizados com novos imports
- Scripts de init/reimport atualizados

### Validação
- **ruff check**: 5 erros pre-existentes (E722 bare excepts, B904 raise-from) — nenhum novo erro introduzido
- **pytest**: 76 passed, 0 failed
- **mypy**: 114 erros pre-existentes — mesma contagem pré-migração
- **check_cross_feature_imports**: 0 violações de isolamento entre features

### Gates de governança adicionados
- **Added**: `scripts/check_cross_feature_imports.py` — valida que nenhuma feature importa de outra feature (apenas `shared/` é permitido)
- **Added**: Gate `check_cross_feature_imports` integrado ao `run_governance_gates.py` e ao pre-commit hook

### Features criadas (8 bounded contexts)

| Feature | Arquivos |
|---------|----------|
| `receita/` | `receita_types.py`, `receita_handler.py`, `receita_data.py`, `receita_scraper.py` |
| `despesa/` | `despesa_types.py`, `despesa_handler.py`, `despesa_data.py`, `despesa_scraper.py` |
| `forecast/` | `forecast_types.py`, `forecast_handler.py`, `forecast_business.py`, `forecast_data.py` |
| `licitacao/` | `licitacao_types.py`, `licitacao_handler.py` |
| `kpi/` | `kpi_types.py`, `kpi_handler.py` |
| `movimento_extra/` | `movimento_extra_types.py`, `movimento_extra_handler.py` |
| `scraping/` | `scraping_types.py`, `scraping_handler.py`, `scraping_orchestrator.py`, `scraping_helpers.py`, `scraping_scheduler.py`, `expense_pdf_sync_service.py`, `historical_data_bootstrap_service.py` |
| `export/` | `export_types.py`, `export_handler.py` |

### Backward compatibility
- Localizações antigas (`api/routes/`, `api/schemas_*`) mantidas com re-export stubs
- `domain/`, `infrastructure/`, `services/`, `etl/` **removidos** (ver seção [CLEANUP] acima)

### Arquivos criados: 41
### Arquivos modificados: ~55 (tests, scripts, main.py, re-exports)
### Nenhuma lógica de negócio alterada

---

## [REFACTOR] Extração de lógica de negócio de handlers para camadas dedicadas

### Contexto
Vários handlers continham lógica de negócio inline (SQL queries, cálculos, chamadas HTTP externas, parsing HTML). A arquitetura exige que `*_handler.py` seja apenas orquestração HTTP, com lógica delegada para `*_business.py`, `*_data.py`, ou `*_adapter.py`.

### Mudanças por feature

#### KPI (`features/kpi/`)
- **Criado** `kpi_data.py` — consultas SQL agregadas (totais anuais, mensais, por ano/tipo, resumo geral)
- **Criado** `kpi_business.py` — cálculos de saldo, percentuais de execução, agregações mensais/anuais
- **Refatorado** `kpi_handler.py` — agora delega para data + business (de 342 → 128 linhas)

#### Licitação (`features/licitacao/`)
- **Criado** `licitacao_adapter.py` — ACL para APIs externas (ComprasBR, Quality HTML) com parsing HTML
- **Refatorado** `licitacao_handler.py` — agora delega para adapter (de 321 → 106 linhas)

#### Movimento Extra (`features/movimento_extra/`)
- **Criado** `movimento_extra_adapter.py` — ACL para API externa Quality
- **Criado** `movimento_extra_business.py` — agrupamento por fundos, insights por categoria, totais
- **Refatorado** `movimento_extra_handler.py` — agora delega para adapter + business (de 383 → 124 linhas)

#### Despesa (`features/despesa/`)
- **Estendido** `despesa_data.py` — adicionados `get_totais_por_ano`, `get_totais_por_mes`, `list_categorias`
- **Refatorado** `despesa_handler.py` — agora delega para SQLDespesaRepository (de 334 → 241 linhas)

#### Receita (`features/receita/`)
- **Estendido** `receita_data.py` — adicionado `list_detalhamento_by_ano`
- **Refatorado** `receita_handler.py` — agora delega para SQLReceitaRepository (de 350 → 259 linhas)

#### Export (`features/export/`)
- **Criado** `export_business.py` — conversão para DataFrame, geração Excel, formatação de colunas
- **Refatorado** `export_handler.py` — agora delega para business + data (de 273 → 139 linhas)

### Arquivos criados
- `backend/features/kpi/kpi_data.py`
- `backend/features/kpi/kpi_business.py`
- `backend/features/licitacao/licitacao_adapter.py`
- `backend/features/movimento_extra/movimento_extra_adapter.py`
- `backend/features/movimento_extra/movimento_extra_business.py`
- `backend/features/export/export_business.py`

### Arquivos modificados
- `backend/features/kpi/kpi_handler.py`
- `backend/features/licitacao/licitacao_handler.py`
- `backend/features/movimento_extra/movimento_extra_handler.py`
- `backend/features/despesa/despesa_handler.py`
- `backend/features/despesa/despesa_data.py`
- `backend/features/receita/receita_handler.py`
- `backend/features/receita/receita_data.py`
- `backend/features/export/export_handler.py`
- `backend/tests/test_api/test_licitacoes.py` (atualizado import)

### Validação
- Ruff: All checks passed
- Pytest: 74 passed (todos os testes passam)
- Cross-feature imports: ✅ isolados
- Dependência: `handler → business → types`, `handler → data → types`, `handler → adapter` (sem violações)

---

## [CLEANUP] Remoção dos diretórios legados backward-compat (re-export stubs)

### Contexto
Os diretórios layer-first (`domain/`, `infrastructure/`, `services/`, `etl/`) foram mantidos como re-export stubs após a migração para vertical bounded contexts. Após verificação, nenhum consumidor externo restava — todos já apontam para `features/` ou `shared/`.

### Diretórios removidos
- `backend/domain/` — entidades, repositórios, serviços de domínio (stub)
- `backend/infrastructure/` — database e repositórios SQL (stub)
- `backend/services/` — serviços de aplicação (stub)
- `backend/etl/` — pipeline ETL, extractors e scrapers (stub)

### Import corrigido
- `backend/shared/pdf_extractor.py` linhas 22-23: `from backend.domain.entities.*` → `from backend.features.*.types`

### Validação
- **ruff check**: All checks passed
- **pytest**: 76 passed, 0 failed
- **governance gates**: 4/5 passed (check_file_length é débito técnico pré-existente em `shared/pdf_extractor.py`)

---

## [FIX] Corrige TypeError ao importar backend por shadowing do built-in `list`

### Contexto
Ao iniciar a aplicação, ocorria `TypeError: 'function' object is not subscriptable` em `despesa_data.py:234` (`list_categorias`). O método `list` definido anteriormente na classe `SQLDespesaRepository` sombreava o built-in `list`, invalidando type hints como `list[str]` em métodos subsequentes.

### Mudanças
- **Renomeado** método `list` → `list_all` em `SQLDespesaRepository` (`despesa_data.py`) e `SQLReceitaRepository` (`receita_data.py`)
- **Atualizado** Protocol `ReceitaRepository` (`receita_types.py`) para refletir o novo nome
- **Atualizados** call sites nos handlers:
  - `despesa_handler.py`
  - `receita_handler.py`
  - `export_handler.py`
- **Removido** uso de `builtins.list` como workaround em `get_categorias` (ambos os repositórios)
- **Ajustados** enums `TipoDespesa` e `TipoReceita` para herdar de `StrEnum` (resolve UP042 do ruff)
- **Removidos** imports de `Enum` e `builtins` não utilizados

### Arquivos modificados
- `backend/features/despesa/despesa_data.py`
- `backend/features/despesa/despesa_handler.py`
- `backend/features/despesa/despesa_types.py`
- `backend/features/receita/receita_data.py`
- `backend/features/receita/receita_handler.py`
- `backend/features/receita/receita_types.py`
- `backend/features/export/export_handler.py`

### Validação
- **ruff check**: All checks passed
- **Importação de `backend.api.main`**: ✅ OK (erro original eliminado)
- **pytest**: Não executável no ambiente atual por falta de dependências do venv ativo, mas nenhuma lógica de negócio foi alterada
