# PROJECT_STATE

Snapshot: 2026-04-22 (atualizado pós-reformulação visual completa do frontend)

## Status geral

Projeto em **bootstrap funcional** com pipeline ETL operacional, dashboard interativo, portal público da transparência e **arquitetura vertical bounded contexts (feature-first)**.

## Funcionalidade implementada

### Backend
- [x] API FastAPI rodando na porta 8000 com prefixo `/api/v1`
- [x] Health check (`GET /health`)
- [x] Endpoints de receitas (listagem, totais por ano/mês, categorias, detalhamento hierárquico)
- [x] Endpoints de despesas (listagem, totais por ano/mês)
- [x] Endpoints de KPIs (resumo, mensal, anual)
- [x] Endpoints de forecast (receitas, despesas)
- [x] Endpoints de exportação (PDF, Excel)
- [x] Endpoints de scraping (status do scheduler, trigger manual, histórico de execuções)
- [x] Scheduler de scraping periódico (APScheduler, 10 min) com primeira execução imediata no startup
- [x] Serviço de scraping QualitySistemas com upsert de receitas, despesas e detalhamento
- [x] Sincronização de PDF de despesas com contrato real do portal (RelatorioPdf retorna path + download subsequente do binário)
- [x] Bootstrap histórico idempotente no startup da API para preencher anos ausentes do banco com base nos PDFs locais
- [x] Sincronização do ano 2026 com prioridade de API (replace por ano para evitar valores antigos persistidos)
- [x] Estratégia de despesas 2026 ajustada para priorizar `BuscaDadosAnual` (fonte canônica de empenhado/liquidado/pago) e usar PDF como fallback quando o anual indisponível
- [x] Validação estrutural do fallback PDF de despesas (não substitui arquivo local quando o download vier sem páginas válidas)
- [x] Schemas Pydantic para todas as bordas
- [x] Proxy routes para licitações: ComprasBR (JSON paginado) e Quality (scraping HTML de dispensas)
- [x] Entidades de domínio com validação (Receita, Despesa)
- [x] Pipeline ETL de extração de PDFs (pdfplumber)
- [x] Detalhamento hierárquico de receitas com extração por indentação de PDF
- [x] Forecasting com Prophet + fallback para projeção linear
- [x] Banco SQLite com modelos ORM (receitas, despesas, forecasts, metadata_etl, receita_detalhamento)

### Frontend
- [x] App Next.js rodando na porta 3000
- [x] Dashboard principal com visualização financeira
- [x] API client Axios centralizado
- [x] Hooks customizados (useDashboardData, useFinanceData, useExport)
- [x] Store de filtros (Zustand)
- [x] Componentes de gráficos, KPI e dashboard
- [x] Seletor de tipo de gráfico reutilizável (bar/line/area/pie)
- [x] Gráfico combinado de receitas x despesas sobrepostos
- [x] Dark finance theme com Tailwind CSS
- [x] Tema claro (light mode) com toggle Sun/Moon no header, CSS custom properties para adaptação automática
- [x] Store de tema (Zustand) com persistência em localStorage
- [x] Tipos TypeScript espelhando schemas da API
- [x] Páginas dedicadas para Receitas, Despesas, Previsões, Comparativo e Relatórios
- [x] Navegação lateral funcional com todas as rotas implementadas
- [x] Forecast anual recompõe 2026 com meses fechados + projeção dos meses remanescentes e suporta seleção de até 5 anos no controle `Projetar:`
- [x] Visualização hierárquica de receitas (tabela escadinha com expand/collapse por nível)
- [x] Remoção de links mortos (Configurações, Ajuda) do menu lateral
- [x] CORS e redirect corrigidos (FastAPI `redirect_slashes=False`, trailing slashes removidas)
- [x] Serialização de tipo de receita corrigida (`.value` → `.name` para enum Pydantic)
- [x] Backend e frontend bindados em `0.0.0.0` para acesso na rede local
- [x] Empacotamento em Docker Compose com backend, frontend, SQLite persistido, `receitas/` em leitura e `despesas/` em escrita para atualização automática
- [x] Override de desenvolvimento com hot reload para backend (`uvicorn --reload`) e frontend (`next dev`)
- [x] Portal público da transparência na rota `/` com grid de cards para navegação entre seções
- [x] Cards do portal: Dashboard Financeiro, Receitas, Despesas, Movimento Extra, Aviso de Licitações (disponíveis) + Obras, Contratos, Diárias, Licitações (em breve)
- [x] Páginas placeholder para 6 seções futuras (Movimento Extra, Obras, Contratos, Diárias, Licitações, Aviso de Licitações)
- [x] Link "Portal" na sidebar para retorno ao portal público
- [x] Metadados atualizados: título "Portal da Transparência | Bandeirantes MS"
- [x] Página de Movimento Extra Orçamentário com glossário interativo, insights automáticos e visualização por fundos
- [x] Proxy backend para API Quality de movimento extra orçamentário (requisição direta ao portal)
- [x] Glossário de fundos municipais com explicação do impacto para o cidadão
- [x] Página de Aviso de Licitações com calendário mensal/semanal, lista paginada, filtros, busca textual, modal de detalhes e KPIs
- [x] Dados unificados de ComprasBR (pregões/concorrências) e Quality (dispensas de licitação)
- [x] Detalhes ComprasBR enriquecidos: datas de propostas, pregoeiro, legislação, disputa, documentos anexados
- [x] Download direto de edital ComprasBR via `arquivoUri`
- [x] Feriados nacionais, estaduais (MS) e móveis exibidos no calendário
- [x] Títulos sucintos de licitações no calendário e lista

### Frontend — Reformulação Visual Completa v2 (2026-04-22)
- [x] **Reformulação completa do frontend** seguindo templates HTML de referência (`design_system/`)
- [x] **Novos componentes de layout**: PortalHeader, PortalFooter, Sidebar expandida (10 itens), Header glassmorphism, DashboardLayout com drawer mobile animado
- [x] **Homepage reformulada**: hero com gradient signature, search bar glass, stat cards flutuantes, grid 4 cards de navegação, seção "Acesso Rápido" com 6 cards, footer 4 colunas
- [x] **Página de Obras implementada**: listagem com filtros, KPIs, grid de cards com progress bar + página de detalhe com cronograma timeline e info cards
- [x] **Dashboard reformulado**: header com seletor de ano, KPIs 2x4, gráficos lado a lado, visão combinada
- [x] **Receitas/Despesas reformuladas**: KPIs com cores semânticas (green/red), breakdown por categoria, tabela com tonal layering
- [x] **Forecast/Comparativo/Relatórios reformulados**: KPIs, insights grid, cards de exportação
- [x] **Movimento Extra reformulado**: todos os 11 sub-componentes reescritos com design system
- [x] **Avisos/Licitações reformulado**: todos os 8 sub-componentes reescritos com glassmorphism modal
- [x] **Ícones migrados** de lucide-react para Material Symbols (`<span className="material-symbols-outlined">`) em todos os componentes
- [x] **framer-motion removido** — transições via CSS `transition-*` e `animate-*`
- [x] **Mobile first** em todos os componentes com breakpoints consistentes
- [x] **Dark mode** completo com `dark:` prefix e CSS custom properties

### Frontend — Reformulação Visual Completa (2026-04-21)
- [x] **Novo design system "The Architectural Archive"** aplicado a todas as 9 páginas ativas
- [x] Paleta de cores: Deep Navy (#00193c) + Emerald Green (#006c47) + Gold (#c29b00)
- [x] Tipografia editorial: Manrope (display) + Inter (body) com hierarquia monumental
- [x] **NO-LINE RULE**: separação visual por tonal layering, sem bordas de 1px
- [x] Surface hierarchy: `surface`, `surface-container-low`, `surface-container-high`, `surface-container-lowest`
- [x] Glassmorphism para elementos flutuantes (header sticky, modais, dropdowns)
- [x] Componentes UI base reutilizáveis: `glass-card`, `surface-card`, `elevated-card`, `kpi-card`, `metric-card`, `chart-container`, `data-table`, `chip-*`, `btn-*`, `input-field`, `select-field`
- [x] Ícones migrados de lucide-react para **Material Symbols do Google** via componente `<Icon />`
- [x] Animações de entrada com **framer-motion** em todas as páginas (fade-in-up, stagger)
- [x] Mobile first com breakpoints responsivos em todos os componentes
- [x] Tema claro/escuro com CSS custom properties e classe `.dark`
- [x] Portal público reformulado: hero monumental, grid de cards com efeitos hover, footer elegante
- [x] Dashboard reformulado: KPIs monumentais, gráficos com novas cores, layout refinado
- [x] Receitas reformuladas: header monumental, cards de resumo, tabela hierárquica sem bordas
- [x] Despesas reformuladas: header monumental, KPIs, tabela paginada, exportação elegante
- [x] Forecast reformulado: header com ícone, seletores elegantes, cards de tendência, metodologia
- [x] Comparativo reformulado: header monumental, gráfico comparativo, tabela ano a ano, estatísticas
- [x] Relatórios reformulados: cards de exportação elegantes, resumo rápido, seção informativa
- [x] Movimento Extra reformulado: KPIs, visualização por fundos, glossário interativo, insights
- [x] Avisos de Licitações reformulados: calendário mensal/semanal, lista paginada, modal elegante

### Dados
- [x] Receitas: ~160 registros (2013–2026) extraídos de PDFs
- [x] Receitas detalhamento: 1.498 itens hierárquicos (2013–2026) extraídos de PDFs
- [x] Despesas: ~250 registros (2013–2026) extraídos de PDFs
- [x] Forecasts: pendente de geração
- [x] Metadata ETL: controle de processamento

## Débito técnico conhecido

### Gates de governança (violadores)

**File length (0 arquivos acima do limite):**

- Todos os arquivos de produção e teste estão dentro do limite de 400 linhas.

**Console/print em produção (9 violações):**
- `frontend/services/api.ts` — 5 ocorrências de `console.*`
- `frontend/hooks/useExport.ts` — 1 ocorrência de `console.*`
- `backend/shared/database/connection.py` — 3 ocorrências de `print()`

**Ação de endurecimento tomada (2026-04-21):**
- Limite unificado para 400 linhas em todos os tipos de arquivo (`.py`, `.ts`, `.tsx`, `.js`, `.jsx`)
- `--baseline` bypass removido do `check_file_length.py` — não há mais escape hatches
- `run_governance_gates.py` agora é strict por padrão (exit 1 em falha, `--warn-only` apenas para diagnóstico)
- Exception metadata agora é apenas documentação de débito técnico — NÃO isenta do gate
- `.pre-commit-config.yaml` criado e hook de pre-commit instalado no git
- Gates agora rodam automaticamente em cada `git commit`

### Arquitetura

- **MIGRAÇÃO REALIZADA (2026-04-21):** Backend migrado de layer-first para vertical bounded contexts (`features/` + `shared/`). Re-exports backward-compatible de `domain/`, `infrastructure/`, `services/`, `etl/` **removidos** (2026-04-21). Apenas `api/routes/` e `api/schemas_*` mantidos como re-exports.
- Testes `test_ml/` ainda vazio; `test_api/` parcialmente iniciado com `test_licitacoes.py`; `test_etl/` parcialmente coberto — cobertura automatizada ainda insuficiente
- Lógica de negócio ainda parcialmente acoplada nos handlers — extrair para `*_business.py` conforme crescer
- `notebooks/` vazio — sem notebooks de exploração
- Alembic migrations configurado mas sem migrations criadas (tabelas criadas por `create_all`)
- CORS permite `*` — precisa ser restrito em produção
- `forecast_business.py` ainda importa modelos ORM via repositório ao invés de usar abstração pura

## Próximos passos planejados

1. Melhorar cobertura de testes (especialmente handlers e business logic)
2. Limpar re-exports backward-compatible restantes (`api/routes/`, `api/schemas_*`)
3. Configurar Alembic migrations
4. Restringir CORS para domínios conhecidos
5. Adicionar autenticação se necessário
6. Implementar testes automatizados no frontend (vitest)
7. Extrair lógica de negócio restante dos handlers para `*_business.py`
8. ~~Consolidar ícones restantes do lucide-react para Material Symbols~~ ✅ Concluído em 2026-04-21

## Ambiente

- Docker Compose: `docker compose up --build`
- Docker Compose dev: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
- Frontend no Docker Compose: `http://localhost:3100`
- Backend no Docker Compose: `http://localhost:8100`
- Backend local/dev: `http://localhost:8000` | Docs: `http://localhost:8000/docs`
- Frontend local/dev: `http://localhost:3000`
- Banco: volume nomeado `dashboard-db` apontando para `/app/database` no container
- Scripts: `bash dev.sh` (menu) ou `bash start.sh` (inicialização rápida)
- API URL no frontend local/dev: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- API URL no frontend de produção: `https://dashboard.bandeirantesms.app.br`
- Endpoints de scraping: `GET /api/v1/scraping/status`, `POST /api/v1/scraping/trigger`, `GET /api/v1/scraping/history`
