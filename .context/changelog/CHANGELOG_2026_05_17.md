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

### Backend — Scrapers Quality gravando novamente no SQLite
- `backend/features/contrato/contrato_adapter.py` — rota antiga `buscaContratoPorAno` substituída pelo fluxo real `SearchAgreementsInSiart`; coleta anual passou a iterar os 12 meses e voltou a popular `contratos`
- `backend/features/convenio/convenio_adapter.py` — base antiga `web/contratos_e_convenios` substituída por `portalquality/convenio`; parser atualizado para o payload real (`CONV_*`, `ESFERA_GOVERNO`) e voltou a popular `convenios`
- `backend/features/emenda/emenda_adapter.py` — integração reescrita para scraping HTML do `portalquality/emenda_parlamentar`; parser passou a extrair tabela real, normalizar valores monetários e preservar linhas duplicadas de protocolo via sufixo do detalhe
- `backend/features/diaria/diaria_adapter.py` — endpoint antigo `buscaDiariaPorAno` substituído por `SearchExpenseInSiart` com POST e parser alinhado às chaves reais (`empenho`, `liquidacao`, `justificativa`, `valorDevolvido`)
- `backend/features/folha/folha_adapter.py` — endpoints passaram a usar `entityLink` real (`prefeitura_municipal_de_bandeirantes`) e a achatar os payloads atuais de `OfficeFinder`, `RoleFinder` e `RoleSearch`
- `backend/alembic/versions/a1307f31be14_merge_heads_before_management_actions.py` — tipagem de `down_revision` corrigida para permitir `mypy .` global verde

## Verification
- ruff check: all clean
- mypy: no new issues
- TypeScript: `tsc --noEmit` passed
- App loads: 127 routes registered
- backend startup fix: `ruff check .` OK; `ruff format --check` nos arquivos alterados OK; `pytest -q` OK; `mypy` nos arquivos alterados OK
- scraping/persistência verificados manualmente: `scrape_contratos(2026)` => 34 itens persistidos; `scrape_convenios(2026)` => 1 item persistido; `scrape_emendas(2026)` => 3 itens persistidos; `fetch_offices(2026,1)` => 34 offices; `fetch_employees(2026,1,1,1)` => 4 servidores
- backend gate final: `ruff check .` OK; `mypy .` OK; `pytest` OK (`259 passed`)

## Fixed

### Backend — Cargo adapter usando endpoint real do Quality
- `backend/features/cargo/cargo_adapter.py` — endpoint inexistente `buscaCargoPorAno` substituído pelo fluxo real:
  1. `ContractsList?action=loadSecretariats` para obter IDs de secretarias
  2. `FilterContractsList` por secretaria com params `entity`, `secretariats`, `year`
  3. Parse do payload `[[{SEC_COD_SEC, FUN_NOME, CAR_DESCRICAO, PAT_DESCRICAO, SITUACAO, ...}]]`
  4. Deduplicação por `(FUN_NOME, CAR_DESCRICAO, ANO)`
  5. Agregação `_aggregate_to_cargo_items()` agrupa por `(CAR_DESCRICAO, categoria)` contando efetivo/comissionado/contratado/eletivo/convocados via `PAT_DESCRICAO`
- `backend/features/cargo/cargo_types.py` — adicionado campo `convocados: int = Field(default=0)` a `CargoItem`
- `backend/shared/database/portal_models.py` — adicionada coluna `convocados` a `CargoModel`
- `backend/features/cargo/cargo_data.py` — upsert e `_row_to_item` atualizados para incluir `convocados`
- `backend/alembic/versions/d5e6f7a8b9c0_add_convocados_to_cargos.py` — migration adicionando coluna `convocados INTEGER NOT NULL DEFAULT 0`

### Frontend — Display de convocados em cargos
- `frontend/types/cargo.ts` — adicionado `convocados: number` a `CargoItem`
- `frontend/app/cargos/cargos-table.tsx` — convocados exibido na linha expandida (após contratado)
- `frontend/app/cargos/cargos-mobile-cards.tsx` — convocados exibido no detalhe expandido (após contratado)

### Backend — Patrimônio adapter usando endpoint real do Quality
- `backend/features/patrimonio/patrimonio_adapter.py` — endpoint inexistente `buscaPatrimonioPorAno` substituído pelo fluxo real:
  1. `{base}/{entity}/orgaos-unidades` para obter pares órgão/unidade
  2. `{base}/{entity}/patrimonios` com params `unit`, `organ`, `tipoDeBem` para cada par
- Adicionados helpers `_parse_money` (formato brasileiro "1.234,56"), `_map_tipo_bem` (M/I/V para Móvel/Imóvel/Veículo), `_infer_ano_from_acquisition` (extrai ano da data dd/mm/yyyy)
- Deduplicação por `id`; filtro `tipo_bem` aplicado pós-fetch
- `backend/features/patrimonio/patrimonio_types.py` — adicionado campo opcional `id: int | None` para dedup da API

## Verification (final)
- `ruff check .`: all clean
- `mypy .`: Success: no issues found in 246 source files
- `pytest`: 259 passed, 20 warnings
- `npm run type-check`: passed
- Persistência verificada: `cargos`=155, `patrimonio`=1396, `contratos`=34, `convenios`=1, `emendas`=3
