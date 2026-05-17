# Changelog 2026-05-17 — Novas Features do Portal da Transparência

## Added

### Backend — Feature `contrato` (Gestão de Contratos)
- **ORM Model**: `ContratoModel` em `quality_models.py` — tabela `contratos` com unique `(ano, numero)`
- **Adapter**: `fetch_contratos()` via httpx com headers de browser para API Quality
- **Handler**: `GET /api/v1/contratos/busca`, `GET /api/v1/contratos/{ano}/{numero}`, `GET /api/v1/contratos/anos`
- **Scheduler**: integrado ao `ScrapingScheduler` principal
- **Migration**: `5ed4359a4e35`

### Backend — Feature `convenio` (Convênios)
- **ORM Models**: `ConvenioModel` + `ConvenioMovimentacaoModel` em `quality_models.py`
- **Handler**: `GET /api/v1/convenios/busca`, `GET /api/v1/convenios/detalhe`, `GET /api/v1/convenios/movimentacoes`, `GET /api/v1/convenios/anos`
- **Scheduler**: integrado ao `ScrapingScheduler`
- **Migration**: `5e79bec64e46`

### Backend — Feature `diaria` (Diárias e Passagens)
- **ORM Model**: `DiariaModel` em `quality_models.py` — tabela `diarias` com unique `(ano, mes, numero_empenho, numero_liquidacao)`
- **Handler**: `GET /api/v1/diarias/busca`, `GET /api/v1/diarias/anos`
- **Scheduler**: integrado ao `ScrapingScheduler`
- **Migration**: `e699d3ca5215`

### Backend — Feature `cargo` (Cargos e Salários)
- **ORM Model**: `CargoModel` em `quality_models.py` — tabela `cargos` com unique `(ano, cargo, categoria)`
- **Handler**: `GET /api/v1/cargos/busca`, `GET /api/v1/cargos/anos`
- **Scheduler**: integrado ao `ScrapingScheduler`

### Backend — Feature `emenda` (Emendas Parlamentares)
- **ORM Model**: `EmendaModel` em `quality_models.py` — tabela `emendas` com unique `(ano, emenda, numero_protocolo)`
- **Handler**: `GET /api/v1/emendas/busca`, `GET /api/v1/emendas/anos`
- **Scheduler**: integrado ao `ScrapingScheduler`
- **Migration**: `a4b5c6d7e8f9`

### Backend — Feature `patrimonio` (Controle Patrimonial)
- **ORM Model**: `PatrimonioModel` em `quality_models.py` — tabela `patrimonio` com unique `(ano, tipo_bem, descricao)`
- **Handler**: `GET /api/v1/patrimonio/busca`, `GET /api/v1/patrimonio/anos`
- **Scheduler**: integrado ao lifespan
- **Migration**: `b0c1d2e3f4a5`

### Backend — Feature `folha` (Folha de Pagamento)
- **ORM Models**: `FolhaOfficeModel` + `FolhaEmployeeModel` em `quality_models.py` — tabelas `folha_offices` (unique `(ano, mes, office_id, department_id)`) e `folha_employees` (unique `(ano, mes, contract, office_id, department_id)`)
- **Adapter**: `fetch_offices()` (OfficeFinder), `fetch_employees()` (RoleFinder), `search_employees()` (RoleSearch) via httpx com headers de browser
- **Handler**: `GET /api/v1/folha/offices`, `GET /api/v1/folha/employees` (com filtros office_id, department_id, keyword + resumo agregado), `GET /api/v1/folha/anos`
- **Scheduler**: `_scrape_folha(year)` no job periódico do `ScrapingScheduler` — itera meses 1-12, busca offices e employees, resiliente por mês/office
- **Migration**: `c0d1e2f3a4b5`

### Frontend — 6 novas páginas
- `/contratos` — Gestão de Contratos (contratos-client.tsx)
- `/convenios` — Convênios (convenios-client.tsx)
- `/diarias` — Diárias e Passagens (diarias-client.tsx)
- `/cargos` — Cargos e Salários (cargos-client.tsx)
- `/emendas` — Emendas Parlamentares (emendas-client.tsx)
- `/patrimonio` — Controle Patrimonial (patrimonio-client.tsx)

### Frontend — Navegação
- `portal-data.ts` mainNavCards: adicionados 5 novos cards (Convênios, Diárias, Cargos, Emendas, Patrimônio)

## Changed
- `backend/shared/database/models.py` — imports de todos os novos modelos para Alembic discovery
- `backend/api/main.py` — registro de 6 novos routers + scheduler integration
- `backend/features/scraping/scraping_scheduler.py` — scraping de contratos, convênios, diárias, cargos, emendas no job periódico

## Fixed

### Backend — Resiliência no startup do scraping Quality
- `backend/features/emenda/emenda_adapter.py` — `fetch_emendas()` agora retorna lista vazia em HTTP 404/5xx ou erro de conexão, evitando falha do startup quando o ano ainda não está disponível na origem
- `backend/features/folha/folha_adapter.py` — `fetch_offices()` e `fetch_employees()` agora retornam lista vazia em HTTP 404/5xx ou erro de conexão, evitando erro repetitivo no startup e mantendo o scraper resiliente por mês/órgão
- `backend/tests/test_etl/test_adapter_http_error_handling.py` — novos testes de regressão para 404/500/200 nos adapters de emenda e folha

## Verification
- ruff check: all clean
- mypy: no new issues
- TypeScript: `tsc --noEmit` passed
- App loads: 127 routes registered
- backend startup fix: `ruff check .` OK; `ruff format --check` nos arquivos alterados OK; `pytest -q` OK; `mypy` nos arquivos alterados OK
- observação: `mypy .` global falha em `alembic/versions/a1307f31be14_merge_heads_before_management_actions.py` e `ruff format --check .` global reporta drift pré-existente fora do escopo
