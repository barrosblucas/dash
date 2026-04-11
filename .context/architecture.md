# Architecture

## Objetivo

Dashboard Financeiro Municipal da Prefeitura de Bandeirantes MS.
Plataforma de visualização e análise de dados financeiros municipais com ETL de PDFs, forecasting e exportação.

## Estrutura do repositório

```
dashboard/
├── backend/                  # API FastAPI (Python)
│   ├── api/                  # Rotas HTTP e schemas Pydantic
│   │   ├── main.py           # Aplicação FastAPI com lifespan
│   │   ├── schemas.py        # Schemas de entrada/saída
│   │   └── routes/           # Rotas por domínio (receitas, despesas, kpis, forecast, export)
│   ├── domain/               # Entidades e regras de negócio
│   │   ├── entities/         # Entidades de domínio (Receita, Despesa)
│   │   ├── repositories/     # Interfaces de repositório (contratos)
│   │   ├── services/         # Serviços de domínio (forecasting)
│   │   └── usecases/         # Casos de uso (preparado para expansão)
│   ├── infrastructure/       # Infraestrutura técnica
│   │   ├── database/         # Engine SQLAlchemy, session factory, models ORM
│   │   └── repositories/     # Implementações concretas de repositórios
│   ├── etl/                  # Pipeline de extração/transformação/carga
│   │   ├── extractors/       # Extração de PDFs (pdfplumber)
│   │   ├── transformers/     # Transformação de dados (preparado)
│   │   └── loaders/          # Carga no banco (preparado)
│   ├── ml/                   # Modelos de ML (preparado para Prophet/scikit-learn)
│   ├── services/             # Serviços de aplicação (preparado)
│   └── tests/                # Testes pytest
│       ├── test_api/         # Testes de integração das rotas
│       ├── test_etl/         # Testes do pipeline ETL
│       └── test_ml/          # Testes dos modelos de ML
│
├── frontend/                 # App Next.js (TypeScript)
│   ├── app/                  # Páginas (Pages Router)
│   │   └── dashboard/        # Dashboard principal
│   ├── components/           # Componentes React
│   │   ├── charts/           # Componentes de gráficos (Recharts/D3)
│   │   ├── dashboard/        # Componentes do dashboard
│   │   ├── kpi/              # Cards de KPI
│   │   ├── layouts/          # Layouts compartilhados
│   │   └── ui/               # Componentes base de UI
│   ├── hooks/                # Custom hooks (useFinanceData, useExport, etc.)
│   ├── services/             # API client (Axios centralizado)
│   ├── stores/               # Estado global (Zustand)
│   ├── lib/                  # Utilitários e constantes
│   └── types/                # Tipos TypeScript compartilhados
│
├── database/                 # Banco SQLite
│   ├── dashboard.db          # Arquivo do banco (desenvolvimento)
│   └── sqlite/               # Scripts SQL auxiliares
│
├── receitas/                 # PDFs fonte de receitas
├── despesas/                 # PDFs fonte de despesas
├── notebooks/                # Jupyter notebooks (exploração)
├── docs/                     # Documentação geral (vazio, preparado)
│
├── .context/                 # Documentação viva canônica
├── AGENTS.md                 # Fluxo operacional para agentes
├── dev.sh                    # Script de desenvolvimento
└── start.sh                  # Script de inicialização
```

## Baseline de produto

- Escopo: Dashboard financeiro municipal com visualização de receitas, despesas, KPIs, forecasting e exportação
- Município: Bandeirantes MS
- Período de dados: 2013–2026 (prioridade: 2016–2026)
- Fonte de dados: PDFs oficiais da prefeitura extraídos via pdfplumber
- Implantação: on-prem, single-tenant

## Fronteiras

- `frontend/` consome `backend/` exclusivamente via HTTP (`/api/v1/*`)
- Schemas Pydantic (`backend/api/schemas.py`) definem o contrato da API
- Tipos TypeScript (`frontend/types/`) espelham os schemas Pydantic
- ORM SQLAlchemy fica restrito ao `backend/infrastructure/`
- Entidades de domínio (`backend/domain/entities/`) não dependem de SQLAlchemy

## Feature-first (organização por domínio)

Cada feature do sistema (receita, despesa, forecast, kpi, export) é organizada por domínio **dentro de cada camada**. Isso significa que os arquivos de uma feature ficam distribuídos nas camadas corretas (api, domain, infrastructure, tests), mas sempre nomeados e agrupados por domínio.

### Features atuais

| Feature | API Route | Entidade | Repository | Service | Types (Frontend) |
|---------|-----------|----------|------------|---------|------------------|
| Receita | `routes/receitas.py` | `entities/receita.py` | `repositories/receita_repository.py` | — | `types/receita.ts` |
| Despesa | `routes/despesas.py` | `entities/despesa.py` | `repositories/sql_despesa_repository.py` | — | `types/despesa.ts` |
| Forecast | `routes/forecast.py` | — | — | `services/forecasting_service.py` | — |
| KPI | `routes/kpis.py` | — | — | — | — |
| Export | `routes/export.py` | — | — | — | — |
| ETL | — | — | — | `etl/extractors/pdf_extractor.py` | — |

### Regra de adição de feature

Ao adicionar uma nova feature, criar os arquivos em cada camada relevante:
1. `api/routes/<feature>.py` — route handler
2. Schemas em `api/schemas.py` — contratos Pydantic
3. `domain/entities/<feature>.py` — entidade de domínio (se aplicável)
4. `domain/services/<feature>_service.py` — lógica de negócio
5. `infrastructure/repositories/sql_<feature>_repository.py` — persistência
6. `tests/test_<camada>/test_<feature>.py` — testes
7. `frontend/types/<feature>.ts` — tipos TypeScript

### Shared vs Feature

- **Shared** (`lib/`, `ui/`, `utils/`): somente código reusado por 2+ features de forma estável
- **Feature**: código específico de um domínio de negócio
- **Nunca** colocar lógica de negócio em `utils/` ou `lib/`

## Fluxo principal (alto nível)

1. Pipeline ETL extrai dados de PDFs financeiros (receitas/despesas)
2. Dados são transformados e carregados no SQLite via SQLAlchemy
3. API FastAPI serve endpoints para receitas, despesas, KPIs e forecast
4. Frontend Next.js consome a API e renderiza dashboard interativo
5. Serviço de forecasting gera previsões com Prophet ou projeção linear
6. Exportação gera relatórios em PDF (reportlab) e Excel (openpyxl)

## Camadas do backend

```
api/routes/        → Controllers HTTP (recebem request, delegam para services)
api/schemas.py     → Contratos de entrada/saída (Pydantic)
domain/entities/   → Entidades de negócio puras (dataclasses)
domain/services/   → Lógica de domínio (forecasting, cálculos)
domain/repositories/ → Interfaces de persistência (contratos)
infrastructure/repositories/ → Implementação SQLAlchemy dos repositórios
infrastructure/database/ → Engine, session, models ORM
etl/               → Pipeline de ingestão de PDFs
```

### Regra de dependência

```
api → domain ← infrastructure
         ↑
        services, entities, repositories (interfaces)
```

- `api/` depende de `domain/` (services, interfaces de repositório)
- `domain/` não depende de nada externo
- `infrastructure/` implementa interfaces de `domain/`
- `etl/` depende de `domain/entities/` mas não de `infrastructure/`

## Modelo de dados

### Entidades principais
- **Receita**: receita orçamentária com previsto, arrecadado e anulado por mês/categoria
- **Despesa**: despesa orçamentária com empenhado, liquidado e pago por mês/categoria
- **Forecast**: previsão gerada por ML com intervalo de confiança
- **MetadataETL**: rastreabilidade de execuções do pipeline de extração

### Enums de domínio
- `TipoReceita`: CORRENTE | CAPITAL
- `TipoDespesa`: CORRENTE | CAPITAL | CONTINGENCIA

## Decisão arquitetural atual

Projeto em bootstrap com arquitetura limpa preparada para evolução:
- Backend com separação domain/infrastructure/api
- ETL funcional para extração de PDFs
- Forecasting com Prophet (com fallback para projeção linear)
- Frontend com dashboard interativo e API client centralizado
- SQLite como banco de desenvolvimento (preparado para migração para PostgreSQL se necessário)
