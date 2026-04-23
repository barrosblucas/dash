# Architecture

## Objetivo

Dashboard Financeiro Municipal da Prefeitura de Bandeirantes MS.
Plataforma de visualização e análise de dados financeiros municipais com ETL de PDFs, forecasting e exportação.

## Estrutura do repositório

```
dashboard/
├── backend/                  # API FastAPI (Python)
│   ├── api/                  # Entry point HTTP
│   │   ├── main.py           # Aplicação FastAPI com lifespan, router registration
│   │   └── schemas.py        # Schemas base (HealthCheck, ErrorResponse)
│   ├── features/             # Bounded contexts verticais (feature-first)
│   │   ├── receita/          # Contexto de receitas
│   │   │   ├── receita_types.py    # Entidade, Enums, Protocol, Schemas Pydantic
│   │   │   ├── receita_handler.py  # Rotas HTTP (delega para data/business)
│   │   │   ├── receita_data.py     # SQL Repository (persistência)
│   │   │   └── receita_scraper.py  # Parser QualitySistemas → entidades
│   │   ├── despesa/          # Contexto de despesas (mesmo padrão)
│   │   ├── forecast/         # Contexto de forecasting
│   │   │   ├── forecast_types.py
│   │   │   ├── forecast_handler.py
│   │   │   └── forecast_business.py  # Lógica Prophet isolada, testável
│   │   ├── kpi/              # Contexto de KPIs
│   │   ├── licitacao/        # Contexto de licitações
│   │   ├── movimento_extra/  # Contexto de movimento extra
│   │   ├── scraping/         # Contexto de scraping/orquestração
│   │   │   ├── scraping_types.py
│   │   │   ├── scraping_handler.py
│   │   │   ├── scraping_orchestrator.py  # Orquestração principal
│   │   │   ├── scraping_helpers.py       # Persistência + logging
│   │   │   ├── scraping_scheduler.py     # APScheduler
│   │   │   ├── expense_pdf_sync_service.py
│   │   │   └── historical_data_bootstrap_service.py
│   │   ├── export/           # Contexto de exportação
│   │   ├── identity/         # Contexto de identidade/admin
│   │   ├── obra/             # Contexto de obras públicas
│   │   └── saude/            # Contexto de Saúde Transparente (snapshots E-Saúde + CRUD de unidades)
│   ├── shared/               # Infraestrutura compartilhada entre features
│   │   ├── database/
│   │   │   ├── connection.py # Engine SQLAlchemy, session factory, DatabaseManager
│   │   │   └── models.py     # Modelos ORM (todos, schema compartilhado)
│   │   ├── pdf_extractor.py  # Extração de PDFs consolidada
│   │   ├── quality_api_client.py # Cliente HTTP QualitySistemas
│   │   ├── security.py       # Hash de senha, JWT e dependências auth
│   │   └── settings.py       # Settings centralizados (CORS, segredos, bootstrap)
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
- ORM SQLAlchemy fica restrito a `*_data.py` dentro de cada feature e a `shared/database/`
- Entidades de domínio em `*_types.py` não dependem de SQLAlchemy, FastAPI ou Prophet
- Features só importam de `shared/` — sem imports cross-feature (validado por `check_cross_feature_imports.py`)

## Vertical Bounded Contexts (feature-first)

O backend é organizado em bounded contexts verticais dentro de `features/`. Cada feature é autossuficiente — contém seus próprios tipos, handlers, lógica de negócio e persistência. Features só dependem de `shared/` e nunca importam umas das outras.

### Convenção de arquivos por feature

| Sufixo | Responsabilidade | Pode importar | Não pode importar |
|--------|-----------------|---------------|-------------------|
| `*_types.py` | Entidades, Enums, Protocols, Schemas Pydantic | Apenas stdlib + pydantic | SQLAlchemy, FastAPI, Prophet |
| `*_handler.py` | Endpoints HTTP — recebe request, delega | FastAPI, types, data, business, adapter | Lógica de negócio inline |
| `*_business.py` | Lógica de domínio pura (ex: Prophet) | types, libs de domínio | SQLAlchemy, FastAPI, HTTP |
| `*_data.py` | Persistência (SQL Repository) | SQLAlchemy, types | FastAPI, HTTP |
| `*_adapter.py` | ACL para APIs externas | httpx, types | FastAPI, SQLAlchemy |
| `*_scraper.py` | Parser de dados externos → entidades | types, shared | FastAPI, SQLAlchemy |

### Features atuais

| Feature | Diretório | Arquivos |
|---------|-----------|----------|
| Receita | `features/receita/` | types, handler, data, scraper |
| Despesa | `features/despesa/` | types, handler, data, scraper |
| Forecast | `features/forecast/` | types, handler, business, data |
| KPI | `features/kpi/` | types, handler, data, business |
| Licitação | `features/licitacao/` | types, handler, adapter |
| Movimento Extra | `features/movimento_extra/` | types, handler, adapter, business |
| Scraping | `features/scraping/` | types, handler, orchestrator, helpers, scheduler, expense_pdf_sync_service, historical_data_bootstrap_service |
| Export | `features/export/` | types, handler, business |
| Identity | `features/identity/` | types, handler, data |
| Obra | `features/obra/` | types, handler, data, business |
| Saúde | `features/saude/` | types, handler, data, business, adapter, scheduler |

### Regra de adição de feature

Ao adicionar uma nova feature, criar diretório em `features/<nome>/`:
1. `<nome>_types.py` — entidades, enums, schemas Pydantic
2. `<nome>_handler.py` — rotas HTTP (delega para data/business)
3. `<nome>_data.py` — persistência SQL (se aplicável)
4. `<nome>_business.py` — lógica de domínio (se aplicável)
5. `<nome>_scraper.py` — parser de dados externos (se aplicável)
6. `tests/test_<camada>/test_<nome>.py` — testes
7. `frontend/types/<nome>.ts` — tipos TypeScript

### Shared vs Feature

- **Shared** (`shared/`): infraestrutura compartilhada (database, pdf_extractor, quality_api_client)
- **Feature** (`features/<nome>/`): código específico de um domínio de negócio
- **Nunca** colocar lógica de negócio em `shared/`
- Features nunca importam de outras features — isolamento validado por `check_cross_feature_imports.py`

### Backward compatibility

Localizações antigas (`domain/`, `infrastructure/`, `services/`, `etl/`, `api/routes/`, `api/schemas_*`) são mantidas como re-exports para compatibilidade. Devem ser removidas quando todos os consumidores forem migrados.

## Fluxo principal (alto nível)

1. Pipeline ETL extrai dados de PDFs financeiros (receitas/despesas)
2. Na inicialização da API, bootstrap idempotente preenche anos ausentes no SQLite com base nos PDFs disponíveis
3. Dados são transformados e carregados no SQLite via SQLAlchemy
4. Para 2026, sincronização recorrente via API Quality roda continuamente e sobrescreve snapshot do ano no banco
5. API FastAPI serve endpoints para receitas, despesas, KPIs e forecast
6. Frontend Next.js consome a API e renderiza dashboard interativo
7. Serviço de forecasting gera previsões com Prophet ou projeção linear
8. Exportação gera relatórios em PDF (reportlab) e Excel (openpyxl)

## Camadas do backend (vertical slicing)

Cada feature é um slice vertical autossuficiente:

```
features/<nome>/
  *_types.py       → Entidades, Enums, Protocols, Schemas (sem infra)
  *_handler.py     → Controllers HTTP (delegação, sem lógica)
  *_business.py    → Lógica de domínio pura (sem infra, sem HTTP)
  *_data.py        → Persistência SQL (SQLAlchemy)
  *_adapter.py     → ACL para APIs externas (httpx, parsing)
  *_scraper.py     → Parser de dados externos → entidades
shared/
  database/        → Engine, session, models ORM (compartilhado)
  pdf_extractor.py → Extração de PDFs
  quality_api_client.py → Cliente HTTP Quality
```

### Regra de dependência

```
handler → types, data, business, adapter
business → types
data → types, shared/database
adapter → types, httpx (ou lib HTTP equivalente)
scraper → types, shared
types → (nenhuma dependência externa)
```

- `*_types.py` não depende de nada externo (nem SQLAlchemy, nem FastAPI, nem Prophet)
- `*_handler.py` orquestra chamadas, não contém lógica de negócio
- `*_business.py` não conhece HTTP nem persistência
- `*_data.py` implementa persistência via SQLAlchemy
- Features não importam de outras features — isolamento garantido por gate

## Modelo de dados

### Entidades principais
- **Receita**: receita orçamentária com previsto, arrecadado e anulado por mês/categoria
- **Despesa**: despesa orçamentária com empenhado, liquidado e pago por mês/categoria
- **Forecast**: previsão gerada por ML com intervalo de confiança
- **MetadataETL**: rastreabilidade de execuções do pipeline de extração
- **User**: identidade administrativa com role, status ativo e versionamento de tokens
- **IdentityToken**: refresh/reset tokens persistidos com `jti`, expiração e revogação
- **Obra**: obra pública identificada externamente por `hash`
- **ObraMedicao**: medições mensais filhas substituídas pela payload de escrita

### Enums de domínio
- `TipoReceita`: CORRENTE | CAPITAL
- `TipoDespesa`: CORRENTE | CAPITAL | CONTINGENCIA

## Decisões arquiteturais

### ADR-001: Migração para Vertical Bounded Contexts (2026-04-21)

**Contexto**: Backend organizado em camadas horizontais (`api/`, `domain/`, `infrastructure/`, `services/`, `etl/`). Para adicionar ou modificar uma feature, era necessário tocar múltiplos diretórios.

**Decisão**: Migrar para bounded contexts verticais (`features/<nome>/`) onde cada feature contém seus tipos, handlers, lógica e persistência. Infraestrutura compartilhada isolada em `shared/`.

**Consequências**:
- Cada feature é autossuficiente — mudanças ficam localizadas
- Isolamento entre features enforce por gate `check_cross_feature_imports.py`
- Convenção de sufixos (`*_types`, `*_handler`, `*_business`, `*_data`) substitui diretórios por camada
- Re-exports backward-compatible mantidos temporariamente nas localizações antigas

### ADR-002: Sessão administrativa híbrida no frontend (2026-04-22)

**Contexto**: o portal público permanece aberto, mas a nova área administrativa exige proteção de navegação no Next.js sem persistir access token em `localStorage`/`sessionStorage`.

**Decisão**: usar route handlers do frontend (`/api/auth/login`, `/api/auth/session`, `/api/auth/logout`) como borda para conversar com `/api/v1/identity/*`, mantendo o refresh token em cookie `HttpOnly` seguro e o access token apenas em memória no cliente. O middleware do Next protege `/admin` pela presença do cookie, enquanto a autorização real permanece no backend.

**Consequências**:
- a navegação protegida fica separada do portal público por um layout administrativo próprio
- o frontend ganha contratos TS dedicados para `identity`, `user` e `obra`
- páginas administrativas conseguem reidratar a sessão via `/api/auth/session` sem expor refresh token ao browser JavaScript

### ADR-003: Identidade administrativa rotativa e obras como bounded contexts próprios (2026-04-22)

**Contexto**: a área administrativa passou a exigir autenticação backend, gestão de usuários, reset de senha e CRUD real de obras com leitura pública e escrita restrita.

**Decisão**:
- introduzir `features/identity/` com access token curto e refresh token rotativo persistido no servidor;
- proteger superfícies administrativas com dependência explícita de usuário admin;
- introduzir `features/obra/` com identificador público por `hash` e medições mensais como entidade filha;
- centralizar CORS e segredos em `shared/settings.py` e `shared/security.py`.

**Consequências**:
- o backend combina access token stateless com refresh/reset tokens revogáveis no servidor;
- reset de senha passa a ser invalidável de forma segura e one-shot;
- obras ficam isoladas em um slice vertical sem dependência de outras features;
- configurações sensíveis deixam de ficar espalhadas na inicialização da aplicação.

### Decisões anteriores

Projeto em bootstrap com arquitetura limpa preparada para evolução:
- ETL funcional para extração de PDFs
- Forecasting com Prophet (com fallback para projeção linear)
- Frontend com dashboard interativo e API client centralizado
- SQLite como banco de desenvolvimento (preparado para migração para PostgreSQL se necessário)
- Entrega local padronizada via Docker Compose com backend FastAPI, frontend Next.js, SQLite persistido em volume nomeado e PDFs montados como leitura
