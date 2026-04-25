### 2026-04-24 — fix(frontend): período estável e saúde com melhor legibilidade

**Classificação:** `mudanca_mecanica`

**Contexto:** Os dashboards públicos de saúde precisavam trocar período sem "piscar" a tela, o perfil epidemiológico precisava de cores mais discrimináveis e o gráfico de procedimentos por especialidade precisava de mais respiro entre os rótulos. Também havia códigos US-xx expostos no módulo.

**Alterado:**
- `frontend/app/saude/farmacia/farmacia-client.tsx`
- `frontend/app/saude/vacinacao/vacinacao-client.tsx`
- `frontend/app/saude/visitas-domiciliares/visitas-domiciliares-client.tsx`
- `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx`
- `frontend/app/saude/saude-bucal/saude-bucal-client.tsx`
  - consultas agora usam `placeholderData: keepPreviousData` para manter o conteúdo anterior enquanto o novo período carrega
  - o ano passa a acompanhar o período selecionado quando o usuário altera a data inicial
  - o período padrão continua sendo calculado pelo ano selecionado

- `frontend/app/saude/perfil-epidemiologico/perfil-epidemiologico-client.tsx`
  - cores passam a variar por categoria demográfica para facilitar leitura visual
  - adicionada uma legenda visual de apoio com os valores por categoria

- `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx`
  - aumentou o espaço do gráfico "Procedimentos por especialidade" para evitar sobreposição dos rótulos

- `frontend/app/saude/*`
  - remoção dos códigos `US-xx` dos olhos de página e dos badges da navegação da saúde

- `frontend/lib/saude-utils.ts`
  - helpers compartilhados para intervalo de período, extração de ano e cor por categoria demográfica

**Validação:**
- `cd frontend && npm run test -- saude-utils.test.ts` — verde
- `cd frontend && npm run lint && npm run type-check && npm run build` — verde
- `cd frontend && npm run test` — verde

---

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


### 2026-04-24 — fix(backend): recarga de dados históricos de receitas e despesas após zeramento do SQLite

**Classificação:** `mudanca_mecanica`

**Contexto:** O banco SQLite foi zerado e precisava ser reabastecido com os dados municipais de receitas e despesas. Os dados históricos (2013-2025) vêm dos PDFs oficiais da prefeitura; os dados de 2026 vêm da API QualitySistemas.

**Alterado:**
- `backend/features/scraping/historical_data_bootstrap_service.py`
  - `bootstrap_missing_years()` executado manualmente com `data_root` apontando para a raiz do projeto (`/home/thanos/dashboard`)
  - Corrigido o caminho de busca dos PDFs: o construtor padrão usava `backend/` como raiz em vez do diretório do projeto

**Executado:**
- Bootstrap histórico para receitas, despesas e detalhamento dos anos 2013-2025
- Scraping da API QualitySistemas para o ano de 2026

**Resultado da carga:**
- Receitas: 160 registros (12 por ano, 2013-2025 + 4 de 2026)
- Despesas: 460 registros (34-36 por ano, 2013-2025 + 4 de 2026)
- Detalhamento de receitas: 1.858 registros (2013-2025 do PDF + 459 de 2026 da API)

**Validação:**
- `GET /api/v1/receitas?ano=2025` — responde com 12 registros
- `GET /api/v1/despesas?ano=2024` — responde com 36 registros
- `GET /api/v1/receitas?ano=2026` — responde com 4 registros (fonte: SCRAPING_2026)
- Health check retorna `database: connected`
- API reiniciada e operacional na porta 8000

---


### 2026-04-24 — fix(frontend): corrigir ano inicial dos dados de 2016 para 2013

**Classificação:** `mudanca_mecanica`

**Contexto:** O frontend tinha o ano inicial de dados hardcoded como 2016 em múltiplos arquivos, mas o banco possui dados desde 2013. Isso fazia com que os seletores de ano, filtros e gráficos de forecast não exibissem os anos 2013-2015.

**Alterado:**
- `frontend/lib/constants.ts`
  - `PERIODO_DADOS.ano_inicio`: 2016 → 2013
  - `PERIODO_DADOS.anos`: ajustado para 14 anos (2013-2026)
- `frontend/stores/filtersStore.ts`
  - `useAnosDisponiveis()`: loop hardcoded de 2016 → 2013
- `frontend/app/forecast/forecast-client.tsx`
  - Query de KPIs anuais: `ano_inicio=2016` → `PERIODO_DADOS.ano_inicio`
  - `enabled`: `trendEndYear >= 2016` → `PERIODO_DADOS.ano_inicio`
  - `availableYears`: cálculo baseado em `PERIODO_DADOS.ano_inicio`
- `frontend/components/dashboard/ForecastSection.tsx`
  - `fetchYearlyKPIs(2016, ...)`: substituído por `PERIODO_DADOS.ano_inicio`
- `frontend/hooks/useFinanceData.ts`
  - Fallback de `ano_inicio` no `useKPIsAnuais`: 2016 → `PERIODO_DADOS.ano_inicio`

**Validação:**
- `cd frontend && npm run lint` — verde
- `cd frontend && npm run type-check` — verde
- `cd frontend && npm run build` — verde

---

### 2026-04-24 — feat(frontend): comparativo selecionável entre quaisquer anos no gráfico Receitas x Despesas

**Classificação:** `mudanca_mecanica`

**Contexto:** O modo comparativo do gráfico Receitas x Despesas só permitia comparar o ano selecionado no dashboard com o ano anterior. Agora o usuário pode comparar qualquer par de anos (ex: 2015 vs 2019, 2017 vs 2025).

**Alterado:**
- `frontend/components/charts/CombinedOverviewChart.tsx`
  - Adicionado estado local `anoBase` independente do `anoSelecionado` global
  - Quando comparativo está ativo, dois seletores: "ano base" e "ano comparativo" com "vs" entre eles
  - Seletor comparativo filtra o ano base para evitar duplicatas
  - `anoAtivo = modoComparativo ? anoBase : anoSelecionado` define o ano principal da query
  - Toggle "Comparar" inicializa `anoBase` a partir do `anoSelecionado` atual
  - Subtítulo, badges, tooltips e legendas refletem os anos corretos
  - Por padrão o comparativo está desligado, mostrando apenas o ano do dashboard

**Validação:**
- `cd frontend && npm run lint` — verde
- `cd frontend && npm run type-check` — verde
- `cd frontend && npm run build` — verde

---


### 2026-04-24 — fix(frontend): cores diferenciadas nos valores do perfil epidemiológico

**Classificação:** `mudanca_mecanica`

**Contexto:** Os cards de métricas quantitativas do perfil epidemiológico exibiam todos os valores na mesma cor (`text-tertiary`), dificultando a distinção visual entre categorias demográficas e clínicas (Mulheres, Crianças, Idosos, Homens, Gestantes, Hipertensos, Diabéticos, etc.).

**Alterado:**
- `frontend/components/saude/SaudePageSection.tsx`
  - `SaudeMetricCard`: nova prop opcional `valueColor?: string`
  - quando `valueColor` é fornecida, aplica `style={{ color: valueColor }}` ao valor, sobrescrevendo a cor do `tone`
  - mantém compatibilidade total com todos os consumidores existentes

- `frontend/app/saude/perfil-epidemiologico/perfil-epidemiologico-client.tsx`
  - iteração de `quantitativeMetrics` agora recebe `index` no `map`
  - cada `SaudeMetricCard` recebe `valueColor={getSaudeDemographicColor(item.label, index)}`
  - reutiliza a função existente `getSaudeDemographicColor` (`lib/saude-utils.ts`) que já mapeia:
    - Mulheres → rosa (`#ec4899`)
    - Homens → azul (`#3b82f6`)
    - Crianças → verde (`#22c55e`)
    - Idosos → âmbar (`#f59e0b`)
    - Gestantes → roxo (`#a855f7`)
    - demais categorias → cores do fallback palette (`#0f4c81`, `#22c55e`, `#f59e0b`, `#06b6d4`, `#a855f7`, `#ef4444`)

**Validação:**
- `cd frontend && npm run lint` — verde
- `cd frontend && npm run type-check` — verde
- `cd frontend && npm run build` — verde

---


### 2026-04-24 — fix(backend): correção de SQLite database lock e Prophet stan_backend

**Classificação:** `mudanca_mecanica`

**Contexto:** Dois erros independentes foram reportados no backend: (1) `database is locked` durante operações de scraping concorrentes no SQLite, e (2) `AttributeError: 'Prophet' object has no attribute 'stan_backend'` ao tentar gerar forecasts.

**Alterado:**
- `backend/shared/database/connection.py`
  - Substituído `pool_size=5, max_overflow=10` por `poolclass=NullPool` para eliminar contenção de conexões no SQLite
  - Aumentado `timeout` de 30 para 60 segundos no `connect_args` do SQLite
  - Import adicionado: `from sqlalchemy.pool import NullPool`

- `backend/requirements.txt`
  - Adicionado pin `cmdstanpy>=1.0.4,<1.1` antes do `prophet==1.1.6` para evitar incompatibilidade com cmdstanpy 1.3.0, que quebra a inicialização do backend STAN do Prophet

**Decisões importantes:**
- `NullPool` é a escolha correta para SQLite em ambientes multi-thread/async porque fecha a conexão física após cada sessão, reduzindo a contenção do writer lock do SQLite
- O downgrade do cmdstanpy de 1.3.0 para 1.0.8 resolve o bug do Prophet 1.1.6 onde `_load_stan_backend` falha silenciosamente e deixa `self.stan_backend` não atribuído

**Validação:**
- `cd backend && /home/thanos/dashboard/venv/bin/ruff check shared/database/connection.py` — verde
- `cd backend && /home/thanos/dashboard/venv/bin/pytest` — 85 passed, 0 failed
- Teste manual: `Prophet(yearly_seasonality=True)` instancia corretamente com backend CMDSTANPY
- Teste manual: engine SQLite criada com `NullPool` e `busy_timeout=60000` confirmados

