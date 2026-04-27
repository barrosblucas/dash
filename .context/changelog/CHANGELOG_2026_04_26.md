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

### Backend — Saúde (Date filtering em endpoints públicos)
- **Fixed** total=0 nos endpoints `/vacinacao`, `/atencao-primaria` e `/saude-bucal` quando `start_date`/`end_date` são enviados mas os dados já existem nas tabelas estruturadas.
  - Causa raiz: os handlers verificavam apenas se as datas estavam presentes para decidir entre banco estruturado e scraping live. Quando datas eram fornecidas, sempre caíam no scraping live (que retornava vazio), resultando em `sum_values() == 0`.
  - Solução:
    1. `build_structured_vacinacao_response` e `build_structured_atencao_primaria_response` agora aplicam `filter_monthly_series_by_date_range` sobre os dados estruturados quando o range é fornecido.
    2. Os handlers de vacinação e atenção primária foram reestruturados para **tentar o banco estruturado primeiro** e só recorrer ao scraping live/snapshot quando não houver dados persistidos.
    3. Handler de saúde bucal já possuía o filtro estruturado; foi mantido com a mesma prioridade (banco primeiro).
    4. **Correção adicional (review)**: Adicionado `filter_monthly_series_by_date_range` também no caminho de fallback (live scraping) dos handlers de vacinação e atenção primária, para que quando o banco estruturado estiver vazio e cair no scraping, o total reflita o período selecionado e não o ano inteiro.
  - Arquivos modificados:
    - `backend/features/saude/saude_public_builders.py` — adicionado `_filter_by_dates` helper e filtros de range nos builders de vacinação e atenção primária
    - `backend/features/saude/saude_public_handler.py` — reordenada lógica de vacinação e atenção primária para structured-first; adicionado filtro de data no fallback live; compressão para gate de 400 linhas
    - `backend/tests/test_api/test_saude_dashboards.py` — ajustado teste de fallback live para refletir o novo comportamento structured-first
  - Validação:
    - `pytest tests/test_api/test_saude_dashboards.py` — 2/2 pass
    - `ruff check features/saude/saude_public_builders.py features/saude/saude_public_handler.py tests/test_api/test_saude_dashboards.py` — pass
    - `mypy features/saude/saude_public_builders.py features/saude/saude_public_handler.py tests/test_api/test_saude_dashboards.py` — pass

### Frontend — Saúde (Constrains de data e "Atendimentos por categoria")
- **Added** limites mínimos de data inicial (`minStartDate`) nos filtros de período das páginas de vacinação, atenção primária e saúde bucal.
  - Vacinação: busca limitada a partir de novembro/2019 (`2019-11-01`)
  - Atenção primária: busca limitada a partir de janeiro/2020 (`2020-01-01`)
  - Saúde bucal: busca limitada a partir de maio/2025 (`2025-05-01`)
  - O valor é clampado via `maxDate()` tanto no estado inicial quanto nos handlers `handleYearChange` e `handleStartDateChange`.
- **Added** painel "Atendimentos por categoria" na página de atenção primária, exibindo os dados de CBO como gráfico de barras vertical roxo, complementar ao painel "Atendimentos por CBO da especialidade" existente.
- **Added** utilitário `maxDate(a, b)` em `saude-utils.ts` para comparação lexicográfica de datas ISO.
- Arquivos modificados:
  - `frontend/components/saude/SaudePeriodFilter.tsx` — prop opcional `minStartDate`
  - `frontend/lib/saude-utils.ts` — export `maxDate`
  - `frontend/app/saude/vacinacao/vacinacao-client.tsx` — clamp `2019-11-01`
  - `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx` — clamp `2020-01-01` + painel "Atendimentos por categoria"
  - `frontend/app/saude/saude-bucal/saude-bucal-client.tsx` — clamp `2025-05-01`
- Validação:
  - `npm run type-check` — pass
  - `npm run lint` — pass
  - `npm run build` — compiled successfully

### Backend/Frontend — Saúde e Obras (composição estruturada multi-ano + mídia/múltiplos locais)
- **Fixed** dashboards de saúde pública com zeros incorretos em ranges multi-ano e faltas de composição entre banco estruturado e fallback live.
  - Solução:
    1. Extraída a composição estruturada para `saude_public_structured.py` e a montagem por slice para `saude_public_dashboards.py`.
    2. Vacinação, atenção primária, saúde bucal e farmácia passaram a agregar por `ano/mes` no banco, cobrindo ranges que atravessam anos.
    3. Atenção primária ganhou `atendimentos_por_categoria` via endpoint verificado de CBO e hospital passou a consolidar série mensal/CID com blocos explícitos de indisponibilidade quando a fonte pública não é verificável.
    4. Fallbacks live por período passaram a reutilizar `saude_snapshots` por faixa consultada, preservando histórico e limitando atualização frequente ao período corrente.
  - Arquivos modificados:
    - `backend/features/saude/saude_public_structured.py`
    - `backend/features/saude/saude_public_dashboards.py`
    - `backend/features/saude/saude_public_live.py`
    - `backend/features/saude/saude_public_handler.py`
    - `backend/features/saude/saude_public_builders.py`
    - `backend/features/saude/saude_resource_catalog.py`
    - `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx`
    - `frontend/app/saude/farmacia/farmacia-client.tsx`
    - `frontend/app/saude/hospital/hospital-client.tsx`
    - `frontend/services/saude-service.ts`
    - `frontend/types/saude.ts`
- **Added** suporte estrutural a obras com múltiplos locais, múltiplas fontes e mídia por obra/medição.
  - Solução:
    1. Criadas as tabelas `obra_locations`, `obra_funding_sources` e `obra_media_assets` via Alembic, preservando os campos legados como derivados do primeiro item.
    2. `obra_data.py` passou a fazer upsert de medições por `sequencia` e a sincronizar links de mídia sem apagar uploads persistidos.
    3. `obra_handler.py` ganhou endpoints de upload, vínculo por URL, remoção e leitura de conteúdo de mídia.
    4. O formulário administrativo foi refeito para suportar múltiplos endereços/pins, múltiplas fontes, parsing decimal com vírgula e anexos por obra e por medição; o detalhe público passou a renderizar locais, fontes e anexos.
  - Arquivos modificados:
    - `backend/alembic/versions/1c2d3e4f5a6b_add_obra_related_tables.py`
    - `backend/features/obra/obra_types.py`
    - `backend/features/obra/obra_data.py`
    - `backend/features/obra/obra_handler.py`
    - `backend/features/obra/obra_media_storage.py`
    - `frontend/components/admin/obras/ObraForm.tsx`
    - `frontend/components/admin/obras/ObraLocationsMap.tsx`
    - `frontend/components/admin/obras/ObraMediaEditor.tsx`
    - `frontend/components/admin/obras/ObraMeasurementsSection.tsx`
    - `frontend/components/admin/obras/obra-form-helpers.ts`
    - `frontend/app/obras/[id]/obra-detalhe-client.tsx`
    - `frontend/services/obra-service.ts`
    - `frontend/types/obra.ts`
  - Validação direcionada:
    - `pytest tests/test_api/test_obra.py -q` — pass
    - `pytest tests/test_api/test_saude_dashboards.py tests/test_api/test_saude_farmacia.py -q` — pass
    - `npm run test -- ObraForm.test.tsx ObrasListPage.test.tsx` — 7/7 pass

## Validação
- `pytest tests/test_etl/test_saude_historical_bootstrap.py` — 7/7 pass
- `pytest tests/test_api/test_saude_dashboards.py` — 2/2 pass
- `pytest tests/` (suite completa) — 89 pass, 0 fail
- `ruff check .` — pass
- `mypy .` — pass
- Frontend: `npm run type-check` — pass
- Frontend: `npm run lint` — pass
- Frontend: `npm run build` — compiled successfully
