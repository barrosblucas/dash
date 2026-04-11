# REPOMAP

Snapshot: 2026-04-11

## Raiz
- `AGENTS.md`: fluxo operacional obrigatório para agentes
- `.context/`: documentação viva canônica
- `dev.sh`: script de desenvolvimento com menu interativo
- `start.sh`: script de inicialização rápida
- `README_PROJETO.md`: visão geral do projeto e stack
- `.gitignore`: exclusões padrão (`node_modules/`, `__pycache__/`, `.next/`, `venv/`, `*.db`)

## Backend (`backend/`)
- `api/main.py`: aplicação FastAPI com prefixo `/api/v1`, lifespan, CORS e exception handler global
- `api/schemas.py`: schemas Pydantic para receitas, despesas, KPIs, forecast, health check, erros e ETL
- `api/routes/receitas.py`: endpoints de receitas (listagem, totais por ano/mês, categorias)
- `api/routes/despesas.py`: endpoints de despesas (listagem, totais por ano/mês)
- `api/routes/kpis.py`: endpoints de KPIs financeiros (resumo, mensal, anual)
- `api/routes/forecast.py`: endpoints de forecasting (receitas, despesas)
- `api/routes/export.py`: endpoints de exportação (PDF, Excel)
- `domain/entities/receita.py`: entidade de domínio Receita com validação e cálculos derivados
- `domain/entities/despesa.py`: entidade de domínio Despesa com validação e cálculos derivados
- `domain/repositories/receita_repository.py`: interface de repositório para receitas
- `domain/services/forecasting_service.py`: serviço de previsão financeira com Prophet e fallback linear
- `infrastructure/database/connection.py`: engine SQLAlchemy, session factory, DatabaseManager
- `infrastructure/database/models.py`: modelos ORM (ReceitaModel, DespesaModel, ForecastModel, MetadataETLModel)
- `infrastructure/database/migrations/`: migrations Alembic (preparado)
- `infrastructure/repositories/sql_receita_repository.py`: implementação SQLAlchemy do repositório de receitas
- `infrastructure/repositories/sql_despesa_repository.py`: implementação SQLAlchemy do repositório de despesas
- `etl/extractors/pdf_extractor.py`: extrator de dados financeiros de PDFs com pdfplumber (receitas e despesas)
- `etl/transformers/`: transformadores de dados (preparado para expansão)
- `etl/loaders/`: carregadores de dados (preparado para expansão)
- `ml/`: modelos de ML (preparado para Prophet/scikit-learn)
- `services/`: serviços de aplicação (preparado para expansão)
- `tests/test_api/`: testes de integração das rotas (preparado)
- `tests/test_etl/`: testes do pipeline ETL (preparado)
- `tests/test_ml/`: testes dos modelos de ML (preparado)
- `pyproject.toml`: configuração de qualidade (ruff, black, mypy, pytest, coverage)
- `requirements.txt`: dependências Python (FastAPI, SQLAlchemy, Pydantic, Prophet, etc.)
- `README.md`: documentação do backend

## Frontend (`frontend/`)
- `package.json`: dependências e scripts (dev, build, lint, type-check, format)
- `next.config.js`: configuração Next.js 14
- `tsconfig.json`: TypeScript strict com path aliases (`@/*`)
- `tailwind.config.js`: configuração Tailwind CSS
- `postcss.config.js`: PostCSS com autoprefixer
- `.eslintrc.js`: ESLint com next/core-web-vitals, TanStack Query plugin, import order
- `.prettierrc` / `.prettierignore`: Prettier config
- `app/layout.tsx`: layout raiz
- `app/dashboard/page.tsx`: página principal do dashboard
- `app/dashboard/dashboard-client.tsx`: componente client do dashboard
- `app/globals.css`: identidade visual (dark finance theme)
- `components/charts/RevenueChart.tsx`: gráfico de receitas com seletor de tipo (bar/line/area/pie)
- `components/charts/ExpenseChart.tsx`: gráfico de despesas com seletor de tipo (bar/line/area/pie)
- `components/charts/CombinedOverviewChart.tsx`: gráfico combinado receitas x despesas com seletor de tipo
- `components/charts/index.ts`: barrel de exports dos gráficos
- `components/dashboard/`: componentes do dashboard
- `components/kpi/`: cards de KPI
- `components/layouts/`: layouts compartilhados
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
- `components/ui/ChartTypeSelector.tsx`: seletor reutilizável de tipo de gráfico (bar/line/area/pie)
- `components/ui/index.ts`: barrel de exports dos componentes UI
- `components/Providers.tsx`: providers React (TanStack Query)
- `hooks/useDashboardData.ts`: hook de dados do dashboard
- `hooks/useFinanceData.ts`: hook genérico de dados financeiros
- `hooks/useRevenueData.ts`: hook de dados de receitas
- `hooks/useExport.ts`: hook de exportação
- `hooks/index.ts`: barrel de exports
- `services/api.ts`: API client Axios centralizado com interceptors
- `stores/filtersStore.ts`: store Zustand de filtros
- `lib/constants.ts`: constantes globais (cores, endpoints, formatos, labels, meses)
- `lib/utils.ts`: utilitários gerais
- `lib/date.ts`: utilitários de data (date-fns)
- `lib/index.ts`: barrel de exports
- `types/api.ts`: tipos de resposta da API
- `types/receita.ts`: tipos de receita
- `types/despesa.py`: tipos de despesa
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
- `check_file_length.py`: gate de tamanho de arquivo (Python ≤ 400, TSX/TS ≤ 300)
- `check_frontend_boundaries.py`: gate de fronteiras (frontend não importa de backend)
- `check_no_console.py`: gate de console.log/print em código de produção
- `check_alembic_migration.py`: gate de migration quando models.py muda
- `run_governance_gates.py`: runner unificado de todos os gates estruturais

## .context/
- `AI-GOVERNANCE.md`: regras obrigatórias de implementação
- `architecture.md`: visão arquitetural de referência
- `REPOMAP.md`: este mapa
- `changelog/`: histórico diário de mudanças
