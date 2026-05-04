# REPOMAP

Snapshot: 2026-05-02

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
- `shared/database/models.py`: modelos ORM (receitas, despesas, forecasts, metadata ETL, detalhamento de receitas, scraping, usuários, tokens de identidade, obras, medições, locais/fontes/mídias de obras, legislações)
- `shared/database/saude_models.py`: modelos ORM de saúde (unidades, horários, snapshots, logs de sync, medicamentos, farmácia, vacinação, epidemiológico, APS, saúde bucal, procedimentos)

#### `alembic/` — migrations
- `alembic.ini`: configuração do Alembic apontando para `backend.shared.database.models.Base`
- `alembic/env.py`: ambiente de migration reutilizando a engine do projeto (`create_db_engine`)
- `alembic/versions/`: diretório de revisions (migration inicial + revisão `7b6610d4f1c2_add_saude_transparente_v1.py` para Saúde Transparente + revisão `043c91035847` para despesa_breakdown, quality_sync_state e quality_unidade_gestora + revisão `686fd3aaaeb2` para colunas mensais em receita_detalhamento + revisão `1c2d3e4f5a6b_add_obra_related_tables.py` para locais/fontes/mídias de obras + revisão `a1b2c3d4e5f6_add_legislacao_table.py` para legislações)
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
- `obra_types.py`: schemas Pydantic de obra com múltiplos locais/fontes/mídias e medições mensais com anexos
- `obra_business.py`: cálculos puros de `valor_economizado` e `valor_medido_total`
- `obra_data.py`: persistência SQLAlchemy de obras, upsert de medições por sequência, locais/fontes, sincronização de mídia e `get_most_recently_updated()` para obra em destaque
- `obra_handler.py`: rotas `/api/v1/obras` com leitura pública, escrita admin, upload/vínculo/remoção de mídia e `GET /destaque` para a obra mais recente
- `obra_media_storage.py`: storage local de uploads de obras com resolução de path e limpeza de arquivos

#### `features/receita/`
- `receita_types.py`: entidade Receita, TipoReceita, ReceitaRepository Protocol, schemas Pydantic
- `receita_handler.py`: endpoints HTTP de receitas (listagem, totais, categorias, detalhamento)
- `receita_data.py`: repositório SQL de receitas (SQLReceitaRepository)
- `receita_scraper.py`: parser de receitas QualitySistemas JSON → entidades

#### `features/despesa/`
- `despesa_types.py`: entidade Despesa, TipoDespesa, schemas Pydantic; novos schemas `DespesaBreakdownResponse`, `DespesaBreakdownListResponse`, `DespesaBreakdownTotalsResponse`
- `despesa_handler.py`: endpoints HTTP de despesas (listagem, totais, categorias, breakdown por órgão/função/elemento)
- `despesa_data.py`: repositório SQL de despesas (`SQLRepesaRepository`, `SQLDespesaBreakdownRepository`) — queries de listagem, totais, categorias e breakdown
- `despesa_scraper.py`: parser de despesas QualitySistemas JSON → entidades; dataclass `DespesaBreakdown` e parsers `parse_despesas_orgao`, `parse_despesas_funcao`, `parse_despesas_elemento`

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
- `licitacao_handler.py`: proxy para licitações — delega para adapter; `GET /proxima` retorna a próxima licitação com data de abertura futura
- `licitacao_adapter.py`: ACL para APIs externas — ComprasBR + Quality (scraping HTML)

#### `features/noticias/`
- `noticias_types.py`: schema `NoticiaResponse` (titulo, chamada, link, data_publicacao, fonte)
- `noticias_adapter.py`: ACL mockada com dados demonstrativos — preparada para fonte RSS/API oficial
- `noticias_handler.py`: endpoint `GET /api/v1/noticias/ultima` para o Painel de Informações Rápidas

#### `features/movimento_extra/`
- `movimento_extra_types.py`: schemas Pydantic de movimento extra orçamentário
- `movimento_extra_handler.py`: proxy para API Quality — delega para adapter e business
- `movimento_extra_adapter.py`: ACL para API externa Quality de movimento extra
- `movimento_extra_business.py`: lógica de domínio — agrupamento por fundos, insights, totais

#### `features/scraping/`
- `scraping_types.py`: schemas Pydantic de scraping (status, trigger, histórico); `ScrapingTriggerRequest` expandido com flag `run_historical`
- `scraping_handler.py`: endpoints de controle do scraping
- `scraping_orchestrator.py`: orquestração do scraping QualitySistemas; métodos `run_full_scraping`, `run_historical_bootstrap`, `scrape_despesas_breakdown`, `scrape_unidades_gestoras` com detecção de mudança por hash SHA-256
- `scraping_helpers.py`: helpers de persistência e logging para scraping; `_replace_breakdown_for_year`, `_upsert_sync_state`, `_get_sync_state_hash`, `_is_year_fully_synced`, `_replace_unidades_gestoras`
- `scraping_scheduler.py`: scheduler APScheduler para scraping periódico (10 min); ano dinâmico, bootstrap histórico no startup, job de full scraping
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
- `saude_public_builders.py`: builders de resposta live/fallback para handlers públicos de saúde (farmácia, visitas, medicamentos-estoque)
- `saude_hospital_payloads.py`: contratos de parâmetros/source_url dos endpoints públicos hospitalares (chart vs tabela)
- `saude_public_structured.py`: agregadores estruturados por `ano/mes`, ranges multi-ano e respostas derivadas do banco
- `saude_public_dashboards.py`: composição por slice dos dashboards públicos de vacinação, APS, farmácia e hospital
- `saude_units_handler.py`: endpoints públicos auxiliares (`unidades`, `horarios`, `sync-status`)
- `saude_admin_handler.py`: endpoints administrativos (`admin/unidades`, `importar-esaude`, `admin/sync`)
- `saude_public_live.py`: fallbacks live para filtros não cobertos por snapshot (`start_date`, `estabelecimento_id`)
- `saude_public_support.py`: helpers HTTP compartilhados das rotas de saúde
- `saude_unit_import.py`: normalização de payloads importados de unidades e horários
- `saude_business.py`: camada de compatibilidade para imports antigos da feature
- `saude_scheduler.py`: APScheduler periódico (6h) para sincronizar snapshots do Saúde Transparente
- `saude_historical_bootstrap.py`: bootstrap idempotente de anos históricos ausentes para recursos year-scoped

#### `features/diario_oficial/`
- `diario_oficial_types.py`: schemas Pydantic (`DiarioEdicao`, `DiarioResponse`) com flag `suplementar`
- `diario_oficial_adapter.py`: ACL HTTP para `diariooficialms.com.br` — parseia HTML com `selectolax` para extrair número, data, link de download, tamanho e detectar edição suplementar
- `diario_oficial_handler.py`: endpoint público `GET /api/v1/diario-oficial/hoje` com cache do scheduler e fallback direto
- `diario_oficial_scheduler.py`: APScheduler com jobs às 06:00 (edição regular) e 16:00 (verifica suplementar), cache em `app.state`

#### `features/legislacao/`
- `legislacao_types.py`: schemas Pydantic (`StatusLegislacao`, `TipoLegislacao`, `LegislacaoItem`, `LegislacaoDetalhe`, `LegislacaoListResponse`, `LegislacaoCreateRequest`, `LegislacaoUpdateRequest`)
- `legislacao_data.py`: persistência SQLAlchemy (`SQLLegislacaoRepository`) com CRUD completo, filtros, paginação e busca textual
- `legislacao_handler.py`: endpoints públicos `GET /api/v1/legislacao` (listagem paginada) e `GET /api/v1/legislacao/{id}` (detalhe) + admin `POST`, `PUT`, `DELETE` com `require_admin_user`
- `legislacao_bootstrap.py`: bootstrap idempotente que carrega 15 legislações mockadas quando a tabela está vazia
- `legislacao_adapter.py`: ACL mockada (mantida como fonte de dados para bootstrap)
- `legislacao_mock_data.py` + `legislacao_mock_data_extra.py`: 15 legislações mockadas para Bandeirantes-MS

#### `features/legislacao_municipal/`
- `legislacao_municipal_types.py`: schemas Pydantic (`LegislacaoBuscaItem`, `LegislacaoBuscaResponse`, `LegislacaoImportRequest`, `LegislacaoDownloadRequest`) com campos `link_legislacao`, `link_diario_oficial`, `anexo_habilitado`
- `legislacao_municipal_handler.py`: endpoints admin `GET /api/v1/legislacao-municipal/buscar` (busca paginada de matérias), `POST /api/v1/legislacao-municipal/importar` (importa matéria como legislação) e `POST /api/v1/legislacao-municipal/download` (download individual que isola a matéria dentro do PDF da edição)
- `legislacao_municipal_adapter.py`: adapter de download individual que valida `link_legislacao`, resolve o PDF direto por `data_publicacao` + `numero_materia`, baixa do DigitalOcean Spaces, recorta a matéria/lei com pdfplumber + pypdf (CropBox) e valida o conteúdo. Se não conseguir isolar a matéria, falha explicitamente em vez de retornar a edição inteira.

#### Camadas legadas (removidas)
- `domain/`, `infrastructure/`, `services/`, `etl/`: **removidos** — re-exports backward-compat eliminados após migração completa para features/
- `api/routes/`: re-exportam de `features/*/`
- `api/schemas_*.py`: re-exportam de `features/*/`
- `tests/test_api/`: testes de integração das rotas
- `tests/conftest.py`: fixtures de integração com banco temporário e bootstrap admin de teste
- `tests/test_api/test_licitacoes.py`: testes unitários do parser HTML de licitações Quality e do proxy ComprasBR
- `tests/test_api/test_legislacao.py`: testes de integração do CRUD de legislações (public endpoints, admin CRUD, auth 401/403, filtros, paginação, bootstrap, update com clear de vinculada)
- `tests/test_api/test_identity.py`: testes de integração de login, refresh/logout, usuários, reset de senha e proteção de `/admin/*`
- `tests/test_api/test_obra.py`: testes de integração do CRUD de obras e medições
- `tests/test_api/test_saude.py`: testes de integração do CRUD/importação de unidades, sync manual e contratos públicos originais de saúde
- `tests/test_api/test_saude_dashboards.py`: testes de integração dos dashboards públicos expandidos e dos fallbacks live por `start_date`/`estabelecimento_id`
- `tests/test_api/test_saude_dashboards_live_fallback.py`: cobertura dedicada do fallback live do hospital e da atenção primária, separada para respeitar o gate de 400 linhas
- `tests/test_etl/`: testes do pipeline ETL (preparado)
- `tests/test_etl/test_historical_data_bootstrap_service.py`: testes unitários do bootstrap histórico (lacunas, execução, utilitários)
- `tests/test_etl/test_receita_scraper.py`: testes unitários do parser de receitas (meses com zero e mês inválido)
- `tests/test_etl/test_scraping_scheduler.py`: testes unitários do scheduler de scraping e sincronização de PDF
- `tests/test_etl/test_saude_scheduler.py`: testes unitários do scheduler da feature saúde
- `tests/test_etl/test_expense_pdf_sync_service.py`: testes unitários da sincronização de PDF de despesas
- `tests/test_etl/test_quality_api_client.py`: testes unitários do contrato de URL do cliente Quality para despesas
- `tests/test_etl/test_diario_oficial.py`: testes unitários do parser HTML do Diário Oficial (10 cenários: regular, suplementar, múltiplas edições, vazio, sem padrão, sem tamanho, traço longo, edição extra/especial)
- `tests/test_etl/test_legislacao_municipal_scraper_download.py`: testes do fluxo Playwright + reCAPTCHA do scraper de legislação municipal (retry, skip, Playwright ausente, CLI)
- `tests/test_etl/test_legislacao_municipal_adapter.py`: testes de integração com mock do DiarioOficialClient para o fluxo de download com recorte (erro explícito sem heading, CropBox, propagação de erros HTTP)
- `tests/test_etl/test_legislacao_municipal_adapter_helpers.py`: testes unitários dos helpers de recorte de PDF (`_clean_html_title`, `_find_heading_position`, `_find_next_heading_edge`, `_crop_pdf_section`) com PDF sintético reportlab
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
- `app/admin/diario-oficial/page.tsx`: página administrativa de busca e importação do Diário Oficial MS
- `app/portal-client.tsx`: componente client do portal com hero, grid de cards, footer e Painel de Informações Rápidas com dados dinâmicos (receitas totais, obra destaque, próxima licitação, notícias)
- `components/portal/QuickInfoCard.tsx`: componente de card clicável para o Painel de Informações Rápidas (link interno e externo)
- `components/portal/portal-data.ts`: dados estáticos, helpers de formatação (currency, timeAgo) e helpers do Diário Oficial
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
- `components/saude/SaudePeriodFilter.tsx`: filtro reutilizável de período (ano + data início/fim) para dashboards de saúde
- `components/saude/SaudeUnitsMap.tsx`: mapa Leaflet client-only com markers, popup e geolocalização opcional
- `components/admin/saude/SaudeUnitsAdminPage.tsx`: shell administrativa da V1 de saúde
- `components/admin/saude/saude-units-form-helpers.ts`: helpers de formulário/horários para CRUD admin de saúde
- `components/admin/obras/ObraForm.tsx`: formulário administrativo de obras com múltiplos locais/fontes e orquestração de uploads
- `components/admin/obras/ObraLocationsMap.tsx`: mapa Leaflet para posicionar pins dos locais da obra
- `components/admin/obras/ObraMediaEditor.tsx`: editor reutilizável de links/uploads de mídia da obra e das medições
- `components/admin/obras/ObraMeasurementsSection.tsx`: seção isolada das medições com anexos por medição
- `components/admin/obras/obra-form-helpers.ts`: helpers de estado, payload e validação do formulário administrativo de obras
- `components/obras/ObraProgressChart.tsx`: gráfico de linha de avanço físico/financeiro planejado vs realizado
- `components/obras/ObraFinancialChart.tsx`: gráfico de barras de desembolso financeiro mensal por medição
- `components/obras/ObraStatusPanel.tsx`: painel lateral de Status Atual com KPIs e valor empenhado
- `components/obras/ObraMeasurementHistory.tsx`: tabela de histórico de medições sem bordas ("No-Line")
- `components/obras/ObraLocationMap.tsx`: mapa Leaflet read-only com toggle Padrão/Satélite
- `components/obras/ObraPhotoGallery.tsx`: galeria de fotos com grid responsivo e lightbox
- `components/obras/index.ts`: barrel export dos componentes de obras
- `components/receitas/ReceitaDetalhamentoTable.tsx`: tabela hierárquica de detalhamento de receitas com expand/collapse
- `components/ui/`: componentes base (shared)
- `app/receitas/page.tsx`: página de receitas municipais
- `app/receitas/receitas-client.tsx`: componente client da página de receitas
- `app/despesas/page.tsx`: página de despesas municipais
- `app/despesas/despesas-client.tsx`: componente client da página de despesas
- `app/despesas/DespesaBreakdownTable.tsx`: componente de breakdown por categoria (Natureza, Função, Órgão, Elemento)
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
- `app/obras/[id]/obra-detalhe-client.tsx`: detalhe da obra com consumo real, múltiplos locais/fontes, mídia global e anexos por medição
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
- `app/saude/hospital/hospital-client.tsx`: dashboard hospitalar com heatmap em largura total, série mensal, não munícipes, CID, procedimentos por período/especialidade e filtros anual/período
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
- `app/legislacoes/page.tsx`: página pública de legislações municipais
- `app/legislacoes/legislacoes-client.tsx`: componente principal (≤400 linhas) com listagem, busca, filtros, grid de cards e paginação
- `app/legislacoes/[id]/page.tsx`: página dinâmica de detalhe da legislação
- `app/legislacoes/[id]/legislacao-detail-client.tsx`: detalhe completo com breadcrumb, informações, texto integral e download
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
- `services/obra-service.ts`: leitura pública, CRUD administrativo e operações de mídia de obras
- `services/portal-service.ts`: dados do portal público — obra destaque, próxima licitação, última notícia, receitas totais
- `services/saude-service.ts`: consumo dos endpoints públicos e administrativos da feature saúde, incluindo vacinação, visitas, APS, saúde bucal, hospital e farmácia
- `services/diario-oficial-service.ts`: cliente `fetchDiarioHoje()` para consulta do endpoint `/api/v1/diario-oficial/hoje`; `buscarDiario()` e `importarDiario()` para os endpoints admin de busca e importação
- `services/legislacao-service.ts`: service da feature legislação com `list(filters)` e `getById(id)`
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
- `types/diario-oficial.ts`: contratos TS da feature diário oficial (`DiarioEdicao`, `DiarioResponse`, `DiarioBuscaItem`, `DiarioBuscaResponse`, `DiarioImportRequest`)
- `types/saude.ts`: contratos TS da feature saúde espelhando os schemas Pydantic do backend, incluindo os novos dashboards públicos
- `types/legislacao.ts`: contratos TS da feature legislação (`TipoLegislacao`, `StatusLegislacao`, `LegislacaoItem`, `LegislacaoDetalhe`, `LegislacaoListResponse`)
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
- `scrape_diario_oficial_leis.py`: scraper de leis municipais — busca via API DataTables, download de edições completas (PDF do DigitalOcean Spaces)
- `scrape_diario_oficial_client.py`: re-export de `DiarioOficialClient` de `shared/`
- `scrape_diario_oficial_models.py`: modelos `LeiItem`, `ScrapeResult`, `LegislacaoItem`, `LegislacaoScrapeResult` + configs
- `scrape_diario_oficial_parsers.py`: parsing de HTML da API, extração de links, números de lei e action-baixar
- `scrape_legislacao_municipal.py`: scraper de matérias legislativas individuais via Playwright (reCAPTCHA v3) + catálogo com links de legislação e diário oficial

## .context/
- `AI-GOVERNANCE.md`: regras obrigatórias de implementação
- `architecture.md`: visão arquitetural de referência
- `REPOMAP.md`: este mapa
- `changelog/`: histórico diário de mudanças
