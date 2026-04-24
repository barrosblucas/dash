# REPOMAP

Snapshot: 2026-04-23

## Raiz
- `AGENTS.md`: fluxo operacional obrigatório para agentes
- `.context/`: documentação viva canônica
- `docker-compose.yml`: orquestra backend e frontend com persistência do SQLite, `receitas/` em leitura e `despesas/` com escrita para sincronização de PDF
- `docker-compose.dev.yml`: override de desenvolvimento com hot reload
- `.dockerignore`: reduz o contexto de build do Docker
- `dev.sh`: script de desenvolvimento com menu interativo
- `start.sh`: script de inicialização rápida
- `README_PROJETO.md`: visão geral do projeto e stack
- `.gitignore`: exclusões padrão (`node_modules/`, `__pycache__/`, `.next/`, `venv/`, `*.db`)

## Backend (`backend/`)

### Arquitetura: Vertical Bounded Contexts (feature-first)

- `api/main.py`: aplicação FastAPI com prefixo `/api/v1`, lifespan, CORS e exception handler global — importa routers dos features e integra os schedulers de scraping e saúde
- `api/schemas.py`: schemas Pydantic base (`HealthCheckResponse`, `ErrorResponse`)

#### `shared/` — infraestrutura compartilhada
- `shared/database/connection.py`: engine SQLAlchemy, session factory, DatabaseManager
- `shared/database/models.py`: modelos ORM (receitas, despesas, forecasts, metadata ETL, detalhamento de receitas, scraping, usuários, tokens de identidade, obras, medições, unidades de saúde, horários, snapshots de saúde, logs de sync de saúde)

#### `alembic/` — migrations
- `alembic.ini`: configuração do Alembic apontando para `backend.shared.database.models.Base`
- `alembic/env.py`: ambiente de migration reutilizando a engine do projeto (`create_db_engine`)
- `alembic/versions/`: diretório de revisions (migration inicial + revisão `7b6610d4f1c2_add_saude_transparente_v1.py` para Saúde Transparente)
- `shared/settings.py`: settings centralizados do backend (CORS, segredos JWT, bootstrap admin, reset de senha)
- `shared/security.py`: hash de senha Argon2, emissão/validação de tokens JWT e dependências de autenticação/autorização
- `shared/pdf_extractor.py`: módulo consolidado — entidades PDF, parsers e classe PDFExtractor
- `shared/quality_api_client.py`: cliente HTTP assíncrono para API QualitySistemas
- `shared/settings.py`: settings centralizados do backend (CORS, segredos JWT, bootstrap admin, reset de senha, base URL/timeout/intervalo do E-Saúde)

#### `features/identity/`
- `identity_types.py`: schemas Pydantic de autenticação, usuários e reset de senha
- `identity_data.py`: persistência de usuários e tokens rotativos/revogáveis + bootstrap do primeiro admin
- `identity_handler.py`: rotas `/api/v1/identity` (login, refresh, logout, me, usuários, reset de senha)

#### `features/obra/`
- `obra_types.py`: schemas Pydantic de obra e medições mensais
- `obra_business.py`: cálculos puros de `valor_economizado` e `valor_medido_total`
- `obra_data.py`: persistência SQLAlchemy de obras e substituição de medições
- `obra_handler.py`: rotas `/api/v1/obras` com leitura pública e escrita admin

#### `features/receita/`
- `receita_types.py`: entidade Receita, TipoReceita, ReceitaRepository Protocol, schemas Pydantic
- `receita_handler.py`: endpoints HTTP de receitas (listagem, totais, categorias, detalhamento)
- `receita_data.py`: repositório SQL de receitas (SQLReceitaRepository)
- `receita_scraper.py`: parser de receitas QualitySistemas JSON → entidades

#### `features/despesa/`
- `despesa_types.py`: entidade Despesa, TipoDespesa, schemas Pydantic
- `despesa_handler.py`: endpoints HTTP de despesas (delega para data layer)
- `despesa_data.py`: repositório SQL de despesas (SQLRepesaRepository) — queries de listagem, totais, categorias
- `despesa_scraper.py`: parser de despesas QualitySistemas JSON → entidades

#### `features/forecast/`
- `forecast_types.py`: schemas Pydantic de forecasting (ForecastPoint, ForecastResponse)
- `forecast_handler.py`: endpoints de forecasting (receitas, despesas)
- `forecast_business.py`: serviço de previsão financeira com Prophet e fallback linear

#### `features/kpi/`
- `kpi_types.py`: schemas Pydantic de KPIs (KPIMensal, KPIAnual, KPIsResponse)
- `kpi_handler.py`: endpoints de KPIs financeiros (resumo, mensal, anual)
- `kpi_data.py`: consultas SQL agregadas para KPIs (totais anuais, mensais, por tipo)
- `kpi_business.py`: lógica de domínio pura — cálculos de saldo, percentuais, agregações

#### `features/licitacao/`
- `licitacao_types.py`: schemas Pydantic de licitações (ComprasBR, dispensas Quality)
- `licitacao_handler.py`: proxy para licitações — delega para adapter
- `licitacao_adapter.py`: ACL para APIs externas — ComprasBR + Quality (scraping HTML)

#### `features/movimento_extra/`
- `movimento_extra_types.py`: schemas Pydantic de movimento extra orçamentário
- `movimento_extra_handler.py`: proxy para API Quality — delega para adapter e business
- `movimento_extra_adapter.py`: ACL para API externa Quality de movimento extra
- `movimento_extra_business.py`: lógica de domínio — agrupamento por fundos, insights, totais

#### `features/scraping/`
- `scraping_types.py`: schemas Pydantic de scraping (status, trigger, histórico)
- `scraping_handler.py`: endpoints de controle do scraping
- `scraping_orchestrator.py`: orquestração do scraping QualitySistemas
- `scraping_helpers.py`: helpers de persistência e logging para scraping
- `scraping_scheduler.py`: scheduler APScheduler para scraping periódico (10 min)
- `expense_pdf_sync_service.py`: sincronização do PDF de despesas
- `historical_data_bootstrap_service.py`: bootstrap idempotente de anos históricos

#### `features/export/`
- `export_types.py`: tipos de exportação
- `export_handler.py`: endpoints de exportação (Excel para receitas, despesas, KPIs)
- `export_business.py`: lógica de domínio — conversão para DataFrame, geração Excel, formatação

#### `features/saude/`
- `saude_types.py`: contratos Pydantic para dashboards, sync e CRUD de unidades/horários
- `saude_adapter.py`: ACL HTTP para os endpoints públicos do E-Saúde (`medicamentos-tabela`, `buscar-dados-quantitativos`, charts, hospital e localização)
- `saude_data.py`: persistência SQLAlchemy de unidades, horários, snapshots genéricos por recurso/ano e logs de sincronização
- `saude_resource_catalog.py`: catálogo dos recursos sincronizados e escopos anuais/defaults do sync
- `saude_sync.py`: orquestração de sync/importação de unidades e composição dos parâmetros por recurso
- `saude_snapshot_mapper.py`: normalização de charts/snapshots, tendência epidemiológica e censo hospitalar
- `saude_public_handler.py`: dashboards públicos (`medicamentos`, `vacinacao`, `visitas-domiciliares`, `perfil-epidemiologico`, `atencao-primaria`, `saude-bucal`, `hospital`, `farmacia`, `perfil-demografico`, `procedimentos-tipo`)
- `saude_units_handler.py`: endpoints públicos auxiliares (`unidades`, `horarios`, `sync-status`)
- `saude_admin_handler.py`: endpoints administrativos (`admin/unidades`, `importar-esaude`, `admin/sync`)
- `saude_public_live.py`: fallbacks live para filtros não cobertos por snapshot (`start_date`, `estabelecimento_id`)
- `saude_public_support.py`: helpers HTTP compartilhados das rotas de saúde
- `saude_unit_import.py`: normalização de payloads importados de unidades e horários
- `saude_business.py`: camada de compatibilidade para imports antigos da feature
- `saude_scheduler.py`: APScheduler periódico (6h) para sincronizar snapshots do Saúde Transparente

#### Camadas legadas (removidas)
- `domain/`, `infrastructure/`, `services/`, `etl/`: **removidos** — re-exports backward-compat eliminados após migração completa para features/
- `api/routes/`: re-exportam de `features/*/`
- `api/schemas_*.py`: re-exportam de `features/*/`
- `tests/test_api/`: testes de integração das rotas
- `tests/conftest.py`: fixtures de integração com banco temporário e bootstrap admin de teste
- `tests/test_api/test_licitacoes.py`: testes unitários do parser HTML de licitações Quality e do proxy ComprasBR
- `tests/test_api/test_identity.py`: testes de integração de login, refresh/logout, usuários, reset de senha e proteção de `/admin/*`
- `tests/test_api/test_obra.py`: testes de integração do CRUD de obras e medições
- `tests/test_api/test_saude.py`: testes de integração do CRUD/importação de unidades, sync manual e contratos públicos originais de saúde
- `tests/test_api/test_saude_dashboards.py`: testes de integração dos dashboards públicos expandidos e dos fallbacks live por `start_date`/`estabelecimento_id`
- `tests/test_etl/`: testes do pipeline ETL (preparado)
- `tests/test_etl/test_historical_data_bootstrap_service.py`: testes unitários do bootstrap histórico (lacunas, execução, utilitários)
- `tests/test_etl/test_receita_scraper.py`: testes unitários do parser de receitas (meses com zero e mês inválido)
- `tests/test_etl/test_scraping_scheduler.py`: testes unitários do scheduler de scraping e sincronização de PDF
- `tests/test_etl/test_saude_scheduler.py`: testes unitários do scheduler da feature saúde
- `tests/test_etl/test_expense_pdf_sync_service.py`: testes unitários da sincronização de PDF de despesas
- `tests/test_etl/test_quality_api_client.py`: testes unitários do contrato de URL do cliente Quality para despesas
- `tests/test_ml/`: testes dos modelos de ML (preparado)
- `pyproject.toml`: configuração de qualidade (ruff, black, mypy, pytest, coverage)
- `requirements.txt`: dependências Python (FastAPI, SQLAlchemy, Pydantic, Prophet, etc.)
- `README.md`: documentação do backend

## Frontend (`frontend/`)
- `package.json`: dependências e scripts (dev, build, lint, type-check, format)
- `Dockerfile`: imagem Node para build e execução do Next.js em container
- `Dockerfile.dev`: imagem Node para execução do Next.js em modo dev com hot reload
- `.dockerignore`: exclusões específicas do build do frontend
- `next.config.js`: configuração Next.js 14 (sem redirect `/ → /dashboard`, rota raiz é o portal público)
- `tsconfig.json`: TypeScript strict com path aliases (`@/*`)
- `tailwind.config.js`: configuração Tailwind CSS (dark palette via CSS variables para suporte light/dark)
- `postcss.config.js`: PostCSS com autoprefixer
- `.eslintrc.js`: ESLint com next/core-web-vitals, TanStack Query plugin, import order
- `.prettierrc` / `.prettierignore`: Prettier config
- `app/layout.tsx`: layout raiz (theme-aware com script anti-FOIT)
- `middleware.ts`: proteção de `/admin` por presença de cookie de refresh da sessão administrativa
- `app/page.tsx`: portal público da transparência (página inicial)
- `app/login/page.tsx`: tela de autenticação para acesso restrito
- `app/api/auth/login/route.ts`: borda frontend para login contra `/api/v1/identity/login`
- `app/api/auth/session/route.ts`: reidrata sessão administrativa via refresh token em cookie HttpOnly
- `app/api/auth/logout/route.ts`: encerra sessão administrativa e limpa cookie de refresh
- `app/admin/layout.tsx`: layout isolado da área administrativa
- `app/admin/page.tsx`: landing page do painel administrativo
- `app/admin/users/page.tsx`: listagem de usuários
- `app/admin/users/new/page.tsx`: cadastro de usuário
- `app/admin/users/[id]/page.tsx`: edição de usuário e reset de senha
- `app/admin/obras/page.tsx`: listagem administrativa de obras
- `app/admin/obras/new/page.tsx`: criação administrativa de obra
- `app/admin/obras/[hash]/page.tsx`: edição administrativa de obra
- `app/admin/saude/unidades/page.tsx`: página administrativa única para CRUD de unidades de saúde, horários, importação e sync manual
- `app/portal-client.tsx`: componente client do portal com hero, grid de cards e footer
- `app/dashboard/page.tsx`: página do dashboard financeiro
- `app/dashboard/dashboard-client.tsx`: componente client do dashboard
- `app/globals.css`: identidade visual (light + dark finance theme com CSS custom properties)
- `components/portal/PlaceholderPage.tsx`: página placeholder reutilizável para seções "Em breve"
- `components/charts/RevenueChart.tsx`: gráfico de receitas com seletor de tipo (bar/line/area/pie)
- `components/charts/ExpenseChart.tsx`: gráfico de despesas com seletor de tipo (bar/line/area/pie)
- `components/charts/CombinedOverviewChart.tsx`: gráfico combinado receitas x despesas com seletor de tipo
- `components/charts/index.ts`: barrel de exports dos gráficos
- `components/dashboard/ForecastSection.tsx`: componente de previsão (≤400 linhas) com gráfico ComposedChart de receitas/despesas históricas e projetadas
- `components/dashboard/forecast-helpers.ts`: fetchers e transformação de dados para ForecastSection
- `components/kpi/`: cards de KPI
- `components/layouts/`: layouts compartilhados (DashboardLayout, Header, Sidebar, PortalHeader, PortalFooter)
- `components/layouts/Sidebar.tsx`: sidebar com navegação completa (10 itens incluindo Obras), logo, footer com "Baixar Dados Abertos"
- `components/layouts/Header.tsx`: header glassmorphism para páginas internas (backdrop-blur-2xl, search, theme toggle)
- `components/layouts/DashboardLayout.tsx`: layout wrapper com sidebar fixa (md+) e drawer mobile animado
- `components/layouts/PortalHeader.tsx`: header público com nav links, theme toggle, "Acesso Restrito"
- `components/layouts/PortalFooter.tsx`: footer com grid 4 colunas + copyright
- `components/saude/SaudeSyncBadge.tsx`: badge reutilizável de última sincronização para a feature saúde
- `components/saude/SaudeStateBlock.tsx`: estados de loading/erro/empty da feature saúde
- `components/saude/SaudePageSection.tsx`: kit visual compartilhado da feature (`SaudePageHeader`, `SaudePanel`, `SaudeMetricCard`, `SaudeUnavailablePanel`, `SaudeFeatureCard`)
- `components/saude/SaudeFeatureNav.tsx`: navegação contextual entre os painéis públicos da Saúde Transparente
- `components/saude/SaudeUnitsMap.tsx`: mapa Leaflet client-only com markers, popup e geolocalização opcional
- `components/admin/saude/SaudeUnitsAdminPage.tsx`: shell administrativa da V1 de saúde
- `components/admin/saude/saude-units-form-helpers.ts`: helpers de formulário/horários para CRUD admin de saúde
- `components/receitas/ReceitaDetalhamentoTable.tsx`: tabela hierárquica de detalhamento de receitas com expand/collapse
- `components/ui/`: componentes base (shared)
- `app/receitas/page.tsx`: página de receitas municipais
- `app/receitas/receitas-client.tsx`: componente client da página de receitas
- `app/despesas/page.tsx`: página de despesas municipais
- `app/despesas/despesas-client.tsx`: componente client da página de despesas
- `app/forecast/page.tsx`: página de previsões financeiras
- `app/forecast/forecast-client.tsx`: componente client da página de previsões
- `app/comparativo/page.tsx`: página de comparativo anual
- `app/comparativo/comparativo-client.tsx`: componente client do comparativo
- `app/relatorios/page.tsx`: página de relatórios e exportação
- `app/relatorios/relatorios-client.tsx`: componente client de relatórios
- `app/movimento-extra/page.tsx`: página de movimento extra orçamentário
- `app/movimento-extra/movimento-extra-client.tsx`: componente principal (285 linhas) com filtros, estado e seleção de view mensal/anual
- `app/movimento-extra/constants.ts`: `CURRENT_YEAR`, `YEARS`
- `app/movimento-extra/glossario.ts`: `getGlossaryKey`, `getGlossary`
- `app/movimento-extra/tipo-pill.tsx`: botão pill de filtro (`TipoPill`)
- `app/movimento-extra/kpi-card.tsx`: card de KPI (`KpiCard`)
- `app/movimento-extra/tipo-badge.tsx`: badge de tipo R/D (`TipoBadge`)
- `app/movimento-extra/fundo-card.tsx`: card de fundo com tooltip de glossário (`FundoCard`)
- `app/movimento-extra/item-row.tsx`: linha de item mobile (`ItemRow`) e desktop (`ItemTableRow`)
- `app/movimento-extra/insight-card.tsx`: card de insight com barra de percentual (`InsightCard`)
- `app/movimento-extra/monthly-bar.tsx`: barra de evolução mensal (`MonthlyEvolutionBar`)
- `app/movimento-extra/mensal-view.tsx`: view completa do modo mensal (KPIs, insights, fundos, itens, glossário)
- `app/movimento-extra/anual-view.tsx`: view completa do modo anual (KPIs, evolução mensal, destaques)
- `app/obras/page.tsx`: página de listagem de obras com filtros, KPIs e grid de cards
- `app/obras/obras-client.tsx`: componente client com consumo real da API de obras, filtros públicos e KPIs
- `app/obras/[id]/page.tsx`: página dinâmica de detalhe da obra
- `app/obras/[id]/obra-detalhe-client.tsx`: detalhe da obra com consumo real, cards contratuais e medições mensais
- `app/saude/page.tsx`: landing page pública da Saúde Transparente
- `app/saude/saude-client.tsx`: landing pública com grade ampliada de painéis da Saúde Transparente
- `app/saude/medicamentos/page.tsx`: página pública de medicamentos
- `app/saude/medicamentos/medicamentos-client.tsx`: estoque paginado por estabelecimento com alerta de itens abaixo do mínimo
- `app/saude/farmacia/page.tsx`: página pública de farmácia
- `app/saude/farmacia/farmacia-client.tsx`: atendimentos e dispensações mensais de medicamentos com filtro por ano
- `app/saude/vacinacao/page.tsx`: página pública de vacinação
- `app/saude/vacinacao/vacinacao-client.tsx`: vacinas aplicadas por mês, ranking e total anual
- `app/saude/visitas-domiciliares/page.tsx`: página pública de visitas domiciliares
- `app/saude/visitas-domiciliares/visitas-domiciliares-client.tsx`: quatro gráficos para motivos, acompanhamento, busca ativa e controle vetorial
- `app/saude/perfil-epidemiologico/page.tsx`: página pública de perfil epidemiológico
- `app/saude/perfil-epidemiologico/perfil-epidemiologico-client.tsx`: quantitativos com tendência opcional e distribuição por sexo
- `app/saude/atencao-primaria/page.tsx`: página pública de atenção primária
- `app/saude/atencao-primaria/atencao-primaria-client.tsx`: produção mensal, procedimentos por especialidade e atendimentos por CBO com filtro por data
- `app/saude/saude-bucal/page.tsx`: página pública de saúde bucal
- `app/saude/saude-bucal/saude-bucal-client.tsx`: série mensal odontológica e total do período
- `app/saude/hospital/page.tsx`: página pública hospitalar
- `app/saude/hospital/hospital-client.tsx`: censo de leitos, movimento, internações, procedimentos e blocos explícitos de indisponibilidade
- `app/saude/hospital/hospital-client.test.tsx`: cobertura dos estados hospitalares indisponíveis
- `app/saude/procedimentos/page.tsx`: página pública de procedimentos
- `app/saude/procedimentos/procedimentos-client.tsx`: gráfico e tabela de procedimentos por tipo
- `app/saude/unidades/page.tsx`: página pública de unidades de saúde
- `app/saude/unidades/unidades-client.tsx`: filtros, contagem e integração dinâmica com mapa Leaflet
- `app/contratos/page.tsx`: placeholder — Gestão de Contratos
- `app/diarias/page.tsx`: placeholder — Diárias e Passagens
- `app/licitacoes/page.tsx`: placeholder — Licitações
- `app/avisos-licitacoes/page.tsx`: página de avisos de licitações
- `app/avisos-licitacoes/avisos-licitacoes-client.tsx`: componente principal (≤400 linhas) com calendário mensal/semanal, lista, filtros e modal
- `app/avisos-licitacoes/constants.ts`: constantes e tipos locais (`ViewMode`, `FonteFilter`, `StatusFilter`, URLs, arrays de filtros)
- `app/avisos-licitacoes/parsers.ts`: parsers `parseComprasBR`, `parseDispensas` e `extrairTituloSucinto`
- `app/avisos-licitacoes/feriados.ts`: cálculo de feriados via algoritmo de Meeus/Jones/Butcher + fixos
- `app/avisos-licitacoes/filters.ts`: funções de filtro (`matchFonte`, `matchStatus`) e formatação (`fmtIsoDate`)
- `app/avisos-licitacoes/status-badge.tsx`: componente `StatusBadge`
- `app/avisos-licitacoes/fonte-badge.tsx`: componente `FonteBadge`
- `app/avisos-licitacoes/licitacao-modal.tsx`: modal de detalhes da licitação com integração ComprasBR
- `app/avisos-licitacoes/month-view.tsx`: visualização mensal do calendário com navegação e itens do dia
- `app/avisos-licitacoes/week-view.tsx`: visualização semanal do calendário com grid de 7 dias
- `app/avisos-licitacoes/list-view.tsx`: visualização em lista com tabela desktop, cards mobile e paginação
- `components/ui/ChartTypeSelector.tsx`: seletor reutilizável de tipo de gráfico (bar/line/area/pie)
- `components/ui/index.ts`: barrel de exports dos componentes UI
- `components/Providers.tsx`: providers React (TanStack Query)
- `hooks/useDashboardData.ts`: hook de dados do dashboard
- `hooks/useFinanceData.ts`: hook genérico de dados financeiros
- `hooks/useRevenueData.ts`: hook de dados de receitas
- `hooks/useMovimentoExtra.ts`: hook React Query para consulta de movimento extra
- `hooks/useLicitacoes.ts`: hooks React Query para licitações (ComprasBR lista + detalhe + dispensas)
- `hooks/useExport.ts`: hook de exportação
- `hooks/index.ts`: barrel de exports
- `services/api.ts`: API client Axios centralizado com interceptors
- `services/auth-service.ts`: cliente do frontend para `/api/auth/*`
- `services/user-service.ts`: CRUD administrativo de usuários
- `services/obra-service.ts`: leitura pública e CRUD administrativo de obras
- `services/saude-service.ts`: consumo dos endpoints públicos e administrativos da feature saúde, incluindo vacinação, visitas, APS, saúde bucal, hospital e farmácia
- `stores/filtersStore.ts`: store Zustand de filtros
- `stores/authStore.ts`: store em memória da sessão administrativa (sem persistência do access token)
- `stores/themeStore.ts`: store Zustand de tema (light/dark) com persistência + hook useChartThemeColors
- `lib/constants.ts`: constantes globais (cores, endpoints, formatos, labels, meses)
- `lib/auth-server.ts`: helpers server-side para cookie de refresh e proxy do backend de identidade
- `lib/obra-formatters.ts`: formatação e labels da feature de obras
- `lib/saude-utils.ts`: labels, navegação, sync badge, tendência e helpers da feature saúde
- `lib/utils.ts`: utilitários gerais
- `lib/index.ts`: barrel de exports
- `types/api.ts`: tipos de resposta da API
- `types/receita.ts`: tipos de receita
- `types/despesa.py`: tipos de despesa
- `types/forecast.ts`: tipos de forecast (ProjectionMode, ChartRow, KPIsResponse, ForecastResponse, etc.)
- `types/movimento-extra.ts`: tipos e glossário de fundos municipais (FUNDEB, FMAS, FMIS, etc.)
- `types/licitacao.ts`: tipos para licitações (ComprasBR, dispensas Quality, unified)
- `types/charts.ts`: tipos de gráficos
- `types/identity.ts`: contratos TS da feature de autenticação
- `types/user.ts`: contratos TS da feature de usuários
- `types/obra.ts`: contratos TS da feature de obras
- `types/saude.ts`: contratos TS da feature saúde espelhando os schemas Pydantic do backend, incluindo os novos dashboards públicos
- `types/index.ts`: barrel de exports
- `public/`: assets estáticos

## Database (`database/`)
- `dashboard.db`: banco SQLite (desenvolvimento, gitignored)
- `dashboard.db-shm` / `dashboard.db-wal`: WAL mode files (gitignored)
- `sqlite/`: scripts SQL auxiliares (preparado)

## Dados fonte
- `receitas/`: PDFs de receitas municipais (por ano, ex: `2025.pdf`)
- `despesas/`: PDFs de despesas municipais (por ano, ex: `2025.pdf`)

## Exploração
- `notebooks/`: Jupyter notebooks (preparado para análise exploratória)

## Scripts (`scripts/`)
- `check_file_length.py`: gate de tamanho de arquivo (strict, sem bypass — Python ≤ 400, TS/TSX/JS ≤ 400)
- `check_frontend_boundaries.py`: gate de fronteiras (frontend não importa de backend)
- `check_cross_feature_imports.py`: gate de isolamento entre features (features só importam de `shared/`)
- `check_no_console.py`: gate de console.log/print em código de produção
- `check_alembic_migration.py`: gate de migration quando models.py muda
- `run_governance_gates.py`: runner unificado (strict por padrão, exit 1 em falha)

## Pre-commit
- `.pre-commit-config.yaml`: gates estruturais rodando automaticamente em cada `git commit`

## Scripts Backend (`backend/scripts/`)
- `reload_detalhamento.py`: script de (re)extração do detalhamento hierárquico de receitas dos PDFs

## .context/
- `AI-GOVERNANCE.md`: regras obrigatórias de implementação
- `architecture.md`: visão arquitetural de referência
- `REPOMAP.md`: este mapa
- `changelog/`: histórico diário de mudanças
