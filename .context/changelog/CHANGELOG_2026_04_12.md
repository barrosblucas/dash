# Changelog — 2026-04-12

## feat: Tema claro para o dashboard financeiro

### Objetivo
Implementar tema claro (light mode) no dashboard, mantendo o tema escuro existente sem nenhuma alteração visual. Toggle disponível no header via ícone Sun/Moon.

### Abordagem técnica
Utilizou-se CSS custom properties com suporte a alpha (`rgb(var(--color-dark-*) / <alpha-value>)`) no Tailwind. A paleta `dark-*` é invertida no `:root` (light) e mantida exata no `.dark`. Isso permite que ~250 referências a classes `bg-dark-*`, `text-dark-*`, `border-dark-*` em 20+ componentes se adaptem automaticamente sem alterar código de componente.

### Arquivos criados
- `frontend/stores/themeStore.ts` — Store Zustand com persistência em localStorage (`bandeirantes-theme`). Exporta `useThemeStore()` para toggle e `useChartThemeColors()` para cores SVG inline adaptáveis ao tema.

### Arquivos alterados
- `frontend/tailwind.config.js` — Paleta `dark` convertida para CSS variables com alpha support. Sombras `card`/`card-hover` usam CSS vars.
- `frontend/app/globals.css` — Bloco `:root` (light) e `.dark` com 12 CSS variables de cor, sombras e grid de chart. Shimmer adaptativo por tema. Grid Recharts usa `var(--chart-grid-color)`. `::selection` usa `text-dark-100` para inverter corretamente.
- `frontend/app/layout.tsx` — Script inline para prevenir flash de tema incorrido (FOIT). `suppressHydrationWarning` no `<html>`. Sem `className="dark"` hardcoded.
- `frontend/components/layouts/Header.tsx` — Toggle Sun/Moon conectado ao `useThemeStore`. Removido `useState` local.
- `frontend/components/layouts/DashboardLayout.tsx` — Importa `useThemeStore` para overlay adaptativo no mobile sidebar.
- `frontend/components/charts/RevenueChart.tsx` — Importa `useChartThemeColors`. SVG inline colors (tick, grid, pie label) adaptáveis.
- `frontend/components/charts/ExpenseChart.tsx` — Idem. `renderPieLabel` movido para dentro do componente para acessar `chartColors`.
- `frontend/components/charts/CombinedOverviewChart.tsx` — Idem. `AXIS_CFG` e `LEGEND_CFG` movidos para dentro do componente.
- `frontend/components/dashboard/ForecastSection.tsx` — Idem. Cores de eixo/grid/ReferenceLine adaptáveis.
- `frontend/components/dashboard/ComparativeSection.tsx` — Idem. Cores de eixo/grid adaptáveis.

### Classificação
- Tipo: `mudanca_mecanica` (wiring de tema, sem mudança de regra de negócio)
- Domínio: `frontend`

### Validação
- `npm run type-check` ✓ (zero erros)
- `npm run build` ✓ (compilado com sucesso, 9 páginas geradas)
- `npm run lint` — warning pré-existente do `@tanstack/eslint-plugin-query` (não relacionado)

---

## feat: Parser de despesas do QualitySistemas (DespesaScraper)

### Objetivo
Criar parser que converte JSON dos endpoints `BuscaDadosAnual` e `NaturezaDespesa` do portal QualitySistemas em entidades de domínio `Despesa`, com degradação graciosa quando a API retorna erro 500.

### Abordagem técnica
`DespesaScraper` com três métodos públicos que consomem payloads JSON e retornam `list[Despesa]`. Valores monetários brasileiros ("1.234.567,89") são parseados via helper `_parse_brazilian_currency` para `Decimal`. Classificação automática de `TipoDespesa` (CORRENTE/CAPITAL/CONTINGENCIA) pela descrição. Merge com fallback: natureza > anual > vazio.

### Arquivos criados
- `backend/etl/scrapers/despesa_scraper.py` — Classe `DespesaScraper` com `parse_despesas_annual`, `parse_despesas_natureza`, `merge_despesa` e helpers privados. 345 linhas.
- `backend/tests/test_etl/test_despesa_scraper.py` — 39 testes unitários cobrindo parsing de moeda, classificação de tipo, payloads anuais/natureza, edge cases (vazio, inválido, zerado) e merge com degradação.

### Arquivos alterados
- `backend/etl/scrapers/__init__.py` — Exporta `DespesaScraper`

### Classificação
- Tipo: `borda_externa` (nova integração com API externa, sem mudança de regra de negócio)
- Domínio: `backend` (ETL)

### Validação
- `ruff check` ✓ (zero erros)
- `mypy` ✓ (sem erros nos arquivos novos)
- `pytest` ✓ (39/39 testes passando)

---

## feat: Scheduler de scraping com APScheduler integrado ao lifespan

### Objetivo
Criar scheduler periódico (10 min) para o pipeline de scraping usando APScheduler, integrado ao ciclo de vida da FastAPI. Substituir `print()` por `logging` no `main.py` (adequação ao gate `check_no_console`).

### Abordagem técnica
`ScrapingScheduler` usa `AsyncIOScheduler` com `coalesce=True`, `max_instances=1`, `misfire_grace_time=60`. Importação lazy do `ScrapingService` via `_create_scraping_service()`. Exceções no job nunca propagam para o scheduler. Instância exposta em `app.state.scraping_scheduler` para acesso via rotas.

### Arquivos criados
- `backend/services/scraping_scheduler.py` — Classe `ScrapingScheduler` com `start()`, `stop()`, `scrape_job()`, `trigger_manual()`, `get_status()`. 165 linhas.

### Arquivos alterados
- `backend/api/main.py` — Lifespan integrado com scheduler. `print()` substituído por `logging`. Imports limpos (removidos `Optional`, `jsonable_encoder`, `ErrorResponse` não utilizados). Description do FastAPI convertida para string sem whitespace trailing. 236 linhas.
- `backend/requirements.txt` — Adicionado `APScheduler==3.10.4` na seção Scheduler.
- `backend/services/__init__.py` — Docstring do pacote.

### Classificação
- Tipo: `borda_externa` (nova infraestrutura de scheduler + integração no lifespan)
- Domínio: `backend`

### Validação
- `ruff check` ✓ nos arquivos modificados (zero erros)
- `mypy` ✓ nos arquivos modificados (zero erros)
- `pytest` ✓ (39/39 testes passando)
- Importação do `ScrapingService` verificada (lazy import compatível com a interface existente)

---

## feat: Serviço de orquestração de scraping com upsert (ScrapingService)

### Objetivo
Criar o `ScrapingService` que orquestra o pipeline completo de scraping: busca na API QualitySistemas → parsing → persistência com upsert e logging de execução.

### Abordagem técnica
- `ScrapingService` instancia `QualityAPIClient`, `ReceitaScraper` e `DespesaScraper` internamente
- `run_scraping(year, data_type)` orquestra receitas e/ou despesas conforme solicitado
- `scrape_receitas()` faz fetch de receitas mensais + detalhamento, upsert de receitas por (ano, mes, categoria) e replace completo do detalhamento por ano
- `scrape_despesas()` faz fetch de dados anuais + natureza, merge com degradação graciosa, upsert por (ano, mes, tipo)
- Todas as exceções são capturadas e logadas — nunca propagam para o scheduler
- `ScrapingLogModel` registra cada execução (RUNNING → SUCCESS/ERROR)
- Detalhamento usa estratégia de full-replace (delete + insert) pois é um dataset completo

### Arquivos criados
- `backend/services/scraping_service.py` — Classe `ScrapingService` com `run_scraping`, `scrape_receitas`, `scrape_despesas` e helpers de upsert/log. 340 linhas.

### Classificação
- Tipo: `borda_externa` (integração com API externa + persistência)
- Domínio: `backend` (services)

### Validação
- `ruff check` ✓ (zero erros)
- `ruff format --check` ✓ (já formatado)
- Linhas: 340 (dentro do limite de 400)

---

## feat: Rotas de controle do scraping (status, trigger, histórico)

### Objetivo
Criar endpoints HTTP para controlar e monitorar o pipeline de scraping: consultar status do scheduler, disparar scraping manualmente e visualizar histórico de execuções.

### Abordagem técnica
Router FastAPI com 3 endpoints em `/api/v1/scraping/`:
- `GET /status` — consulta scheduler via `app.state.scraping_scheduler` e banco para montar snapshot de receitas/despesas
- `POST /trigger` — delega execução manual ao scheduler com ano e tipo de dado configuráveis
- `GET /history` — consulta `ScrapingLogModel` ordenado por `started_at` desc com limite configurável (default 20)

Todos os endpoints fazem degradação graciosa quando o scheduler não está disponível (retornam status "unavailable" ao invés de erro 500).

### Arquivos criados
- `backend/api/routes/scraping.py` — Router com 3 endpoints (status, trigger, history) e helper `_build_trigger_message`. 230 linhas.

### Arquivos alterados
- `backend/api/routes/__init__.py` — Exporta `scraping_router`
- `backend/api/main.py` — Importa e registra `scraping_router` com prefixo `/api/v1`

### Classificação
- Tipo: `borda_externa` (novos endpoints de API, sem mudança de regra de negócio)
- Domínio: `backend` (API)

### Validação
- `ruff check` ✓ nos 3 arquivos (zero erros)
- `mypy` — erros pré-existentes (89 total, nenhum novo introduzido pelos arquivos criados)
- `pytest` ✓ (39/39 testes passando)
