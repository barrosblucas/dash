### 2026-04-24 — feat(backend): filtros de período dinâmicos nos endpoints públicos de saúde

**Classificação:** `borda_externa`

**Contexto:** A API externa do E-Saúde possui recursos que respeitam filtros de data (`data_de_inicio`/`data_de_fim`) e outros que respeitam filtro de ano (`ano`), além de alguns que ignoram qualquer filtro. Esta entrega expõe esses filtros nos endpoints públicos do backend, mantendo compatibilidade total com os contratos existentes.

**Adicionado:**
- `backend/features/saude/saude_adapter.py`
  - `ESaudeClient.fetch_chart_by_date_range(resource, start_date, end_date)` → chama `fetch_public_payload` com `data_de_inicio`/`data_de_fim`
  - `ESaudeClient.fetch_chart_by_year(resource, year)` → chama `fetch_public_payload` com `ano`

- `backend/features/saude/saude_public_live.py`
  - `load_chart_payload(repo, resource, year, start_date, end_date)` → helper genérico que escolhe snapshot ou live conforme escopo e parâmetros
  - `load_atencao_primaria_procedimentos(repo, start_date, end_date)` → busca live com date range
  - `load_visitas_payload(repo, resource, start_date, end_date)` → busca live com date range
  - `load_farmacia_ranking(repo, start_date, end_date)` → busca live com date range
  - `load_vacinacao_ranking(repo, start_date, end_date)` → busca live com date range

- `backend/features/saude/saude_snapshot_mapper.py`
  - `filter_monthly_series_by_date_range(items, start_date, end_date)` → filtra `SaudeMonthlySeriesItem` por label que contém ano/mês dentro do range
  - `_parse_monthly_label(label)` → extrai `datetime` de labels como `Jan/2024`, `2024-01` ou `2024`

- `backend/features/saude/saude_types.py`
  - `SaudeAtencaoPrimariaResponse.end_date: str`
  - `SaudeVacinacaoResponse.start_date: str | None`, `end_date: str | None`
  - `SaudeVisitasDomiciliaresResponse.start_date: str | None`, `end_date: str | None`
  - `SaudeFarmaciaResponse.start_date: str | None`, `end_date: str | None`, `top_medicamentos: list[SaudeLabelValueItem]`
  - `SaudeBucalResponse.start_date: str | None`, `end_date: str | None`

**Alterado:**
- `backend/features/saude/saude_public_handler.py`
  - `GET /api/v1/saude/atencao-primaria`: aceita `end_date`; `ATENCAO_PRIMARIA_PROCEDIMENTOS` busca live com date range; `ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL` busca snapshot por ano ou live por ano
  - `GET /api/v1/saude/vacinacao`: aceita `start_date` e `end_date`; `VACINAS_RANKING` busca live com date range quando date range é fornecido
  - `GET /api/v1/saude/visitas-domiciliares`: aceita `start_date` e `end_date`; busca live com date range quando fornecido
  - `GET /api/v1/saude/farmacia`: aceita `start_date` e `end_date`; `MEDICAMENTOS_ATENDIMENTOS_MENSAL` busca por ano; `MEDICAMENTOS_DISPENSADOS_MENSAL` busca snapshot geral e filtra localmente (API ignora filtro); `MEDICAMENTOS_RANKING` busca live com date range; adiciona `top_medicamentos` ao response
  - `GET /api/v1/saude/saude-bucal`: aceita `start_date` e `end_date`; busca snapshot geral e filtra localmente (API ignora filtro)
  - `GET /api/v1/saude/procedimentos-tipo`: **não modificado** — a API externa não suporta filtro de período

**Decisões importantes:**
- Recursos que a API externa ignora filtro (`medicamentos dispensados`, `saúde bucal`) são buscados no snapshot geral e filtrados localmente pelo período via `filter_monthly_series_by_date_range`
- `year` continua obrigatório nos endpoints que já o exigiam, preservando compatibilidade total
- Erros da API externa continuam propagados via `external_error(exc)` de `saude_public_support.py`

### 2026-04-24 — feat(frontend): integração de filtros de período nos dashboards de saúde

**Classificação:** `borda_externa`

**Contexto:** O backend já foi atualizado para suportar `start_date`/`end_date` nos endpoints de saúde. Esta entrega integra esses filtros no frontend de forma consistente e reutilizável.

**Adicionado:**
- `frontend/components/saude/SaudePeriodFilter.tsx`
  - Componente reutilizável com dropdown de ano (opcional), input de data início e input de data fim
  - Sincroniza automaticamente `startDate` (01/01/ano) e `endDate` (31/12/ano ou data atual se ano corrente) quando o ano muda
  - Layout responsivo: grid 3 colunas em desktop, 1 em mobile

**Alterado:**
- `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx`
  - Substitui inputs manuais por `SaudePeriodFilter`
  - Adiciona `endDate` ao state e ao `queryKey`/`queryFn`
  - KPI "Atendimentos no período" continua somando os valores filtrados retornados pelo backend

- `frontend/app/saude/vacinacao/vacinacao-client.tsx`
  - Adiciona `SaudePeriodFilter` com states `startDate`/`endDate`
  - Atualiza `queryKey` e `queryFn` para passar o período
  - Corrige espaçamento do gráfico "Vacinas mais aplicadas" (`margin.left: 40`, `YAxis.width: 180`)
  - KPI de total atualizado para refletir o período filtrado

- `frontend/app/saude/visitas-domiciliares/visitas-domiciliares-client.tsx`
  - Adiciona `SaudePeriodFilter` sem dropdown de ano (apenas datas início/fim)
  - Atualiza `queryKey` e `queryFn` com `start_date`/`end_date`
  - KPIs refletem os totais do período filtrado

- `frontend/app/saude/farmacia/farmacia-client.tsx`
  - Adiciona `SaudePeriodFilter` com states `startDate`/`endDate`
  - Atualiza `queryKey` e `queryFn`
  - Adiciona painel "Medicamentos com mais saídas" (TOP 10) com barra de progresso e porcentagem em relação ao total do período

- `frontend/app/saude/saude-bucal/saude-bucal-client.tsx`
  - Adiciona `SaudePeriodFilter` com states `startDate`/`endDate`
  - Atualiza `queryKey` e `queryFn`

**Inalterado:**
- `frontend/app/saude/procedimentos/procedimentos-client.tsx` — API externa não suporta filtro de período

**Validação:**
- `cd frontend && npm run lint` — verde
- `cd frontend && npm run type-check` — verde
- `cd frontend && npm run build` — verde

---

**Validação (backend):**
- `cd backend && ../venv/bin/ruff check .` — verde (1 fix automático em teste pré-existente)
- `cd backend && ../venv/bin/mypy backend/features/saude/` — apenas erros pré-existentes de stubs faltantes (fastapi, pydantic, httpx)
- `cd backend && ../venv/bin/pytest backend/tests/test_api/test_saude.py` — verde

