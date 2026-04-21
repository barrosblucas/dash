# REPOMAP

Snapshot: 2026-04-20

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
- `api/main.py`: aplicação FastAPI com prefixo `/api/v1`, lifespan, CORS e exception handler global
- `api/schemas.py`: schemas Pydantic para receitas, despesas, KPIs, forecast, health check, erros, ETL, movimento extra e licitações
- `api/routes/receitas.py`: endpoints de receitas (listagem, totais por ano/mês, categorias, detalhamento hierárquico)
- `api/routes/despesas.py`: endpoints de despesas (listagem, totais por ano/mês)
- `api/routes/kpis.py`: endpoints de KPIs financeiros (resumo, mensal, anual)
- `api/routes/forecast.py`: endpoints de forecasting (receitas, despesas)
- `api/routes/export.py`: endpoints de exportação (PDF, Excel)
- `api/routes/scraping.py`: endpoints de controle do scraping (status, trigger manual, histórico de execuções)
- `api/routes/movimento_extra.py`: proxy para API Quality de movimento extra orçamentário (ano, mês, tipo=R/D/AMBOS, agrupamento por fundo)
- `api/routes/licitacoes.py`: proxy para licitações — ComprasBR (JSON paginado + detalhes por ID) e Quality (scraping HTML de dispensas)
- `domain/entities/receita.py`: entidade de domínio Receita com validação e cálculos derivados
- `domain/entities/despesa.py`: entidade de domínio Despesa com validação e cálculos derivados
- `domain/repositories/receita_repository.py`: interface de repositório para receitas
- `domain/services/forecasting_service.py`: serviço de previsão financeira com Prophet e fallback linear
- `infrastructure/database/connection.py`: engine SQLAlchemy, session factory, DatabaseManager
- `infrastructure/database/models.py`: modelos ORM (ReceitaModel, DespesaModel, ForecastModel, MetadataETLModel, ReceitaDetalhamentoModel)
- `infrastructure/database/migrations/`: migrations Alembic (preparado)
- `infrastructure/repositories/sql_receita_repository.py`: implementação SQLAlchemy do repositório de receitas
- `infrastructure/repositories/sql_despesa_repository.py`: implementação SQLAlchemy do repositório de despesas
- `backend/Dockerfile`: imagem Python para execução da API FastAPI via uvicorn
- `etl/extractors/pdf_extractor.py`: extrator de dados financeiros de PDFs com pdfplumber (receitas, despesas e detalhamento hierárquico)
- `etl/scrapers/quality_api_client.py`: cliente HTTP assíncrono para API do portal QualitySistemas (receitas e despesas com retry; despesas via rota com barra dupla)
- `etl/scrapers/despesa_scraper.py`: parser de despesas QualitySistemas JSON → entidades Despesa (annual, natureza, merge com degradação graciosa)
- `etl/transformers/`: transformadores de dados (preparado para expansão)
- `etl/loaders/`: carregadores de dados (preparado para expansão)
- `ml/`: modelos de ML (preparado para Prophet/scikit-learn)
- `services/`: serviços de aplicação
- `services/scraping_service.py`: orquestração do scraping QualitySistemas com upsert (receitas, despesas, detalhamento)
- `services/scraping_scheduler.py`: scheduler APScheduler para scraping periódico (10 min) com disparo imediato no startup
- `services/expense_pdf_sync_service.py`: sincronização do PDF de despesas em duas etapas (geração de path via `RelatorioPdf` + download do binário)
- `services/historical_data_bootstrap_service.py`: bootstrap idempotente de anos históricos ausentes a partir dos PDFs no startup da API
- `tests/test_api/`: testes de integração das rotas
- `tests/test_api/test_licitacoes.py`: testes unitários do parser HTML de licitações Quality e do proxy ComprasBR
- `tests/test_etl/`: testes do pipeline ETL (preparado)
- `tests/test_etl/test_historical_data_bootstrap_service.py`: testes unitários do bootstrap histórico (lacunas, execução, utilitários)
- `tests/test_etl/test_receita_scraper.py`: testes unitários do parser de receitas (meses com zero e mês inválido)
- `tests/test_etl/test_scraping_scheduler.py`: testes unitários do scheduler de scraping e sincronização de PDF
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
- `app/page.tsx`: portal público da transparência (página inicial)
- `app/portal-client.tsx`: componente client do portal com hero, grid de cards e footer
- `app/dashboard/page.tsx`: página do dashboard financeiro
- `app/dashboard/dashboard-client.tsx`: componente client do dashboard
- `app/globals.css`: identidade visual (light + dark finance theme com CSS custom properties)
- `components/portal/PlaceholderPage.tsx`: página placeholder reutilizável para seções "Em breve"
- `components/charts/RevenueChart.tsx`: gráfico de receitas com seletor de tipo (bar/line/area/pie)
- `components/charts/ExpenseChart.tsx`: gráfico de despesas com seletor de tipo (bar/line/area/pie)
- `components/charts/CombinedOverviewChart.tsx`: gráfico combinado receitas x despesas com seletor de tipo
- `components/charts/index.ts`: barrel de exports dos gráficos
- `components/dashboard/`: componentes do dashboard
- `components/kpi/`: cards de KPI
- `components/layouts/`: layouts compartilhados
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
- `app/movimento-extra/movimento-extra-client.tsx`: componente client com glossário interativo, insights, cards por fundo, filtros e busca
- `app/obras/page.tsx`: placeholder — Acompanhamento de Obras
- `app/contratos/page.tsx`: placeholder — Gestão de Contratos
- `app/diarias/page.tsx`: placeholder — Diárias e Passagens
- `app/licitacoes/page.tsx`: placeholder — Licitações
- `app/avisos-licitacoes/page.tsx`: página de avisos de licitações
- `app/avisos-licitacoes/avisos-licitacoes-client.tsx`: página completa com calendário mensal/semanal, lista, filtros e modal
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
- `stores/filtersStore.ts`: store Zustand de filtros
- `stores/themeStore.ts`: store Zustand de tema (light/dark) com persistência + hook useChartThemeColors
- `lib/constants.ts`: constantes globais (cores, endpoints, formatos, labels, meses)
- `lib/utils.ts`: utilitários gerais
- `lib/date.ts`: utilitários de data (date-fns)
- `lib/index.ts`: barrel de exports
- `types/api.ts`: tipos de resposta da API
- `types/receita.ts`: tipos de receita
- `types/despesa.py`: tipos de despesa
- `types/movimento-extra.ts`: tipos e glossário de fundos municipais (FUNDEB, FMAS, FMIS, etc.)
- `types/licitacao.ts`: tipos para licitações (ComprasBR, dispensas Quality, unified)
- `types/charts.ts`: tipos de gráficos
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
