# PROJECT_STATE

Snapshot: 2026-04-18 (atualizado)

## Status geral

Projeto em **bootstrap funcional** com pipeline ETL operacional e dashboard interativo.

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

### Dados
- [x] Receitas: ~160 registros (2013–2026) extraídos de PDFs
- [x] Receitas detalhamento: 1.498 itens hierárquicos (2013–2026) extraídos de PDFs
- [x] Despesas: ~250 registros (2013–2026) extraídos de PDFs
- [x] Forecasts: pendente de geração
- [x] Metadata ETL: controle de processamento

## Débito técnico conhecido

### Gates de governança (violadores)

**File length (6 arquivos acima do limite):**
- `backend/etl/extractors/pdf_extractor.py` — 844 linhas (limite: 400)
- `frontend/components/dashboard/ForecastSection.tsx` — 347 linhas (limite: 300)
- `frontend/hooks/useFinanceData.ts` — 345 linhas (limite: 300)
- `frontend/lib/date.ts` — 413 linhas (limite: 300)
- `frontend/lib/utils.ts` — 326 linhas (limite: 300)
- `frontend/types/charts.ts` — 304 linhas (limite: 300)

**Console/print em produção (9 violações):**
- `frontend/services/api.ts` — 5 ocorrências de `console.*`
- `frontend/hooks/useExport.ts` — 1 ocorrência de `console.*`
- `backend/infrastructure/database/connection.py` — 3 ocorrências de `print()`

### Arquitetura

- Testes `test_api/` e `test_ml/` ainda vazios; `test_etl/` parcialmente coberto — cobertura automatizada ainda insuficiente
- `domain/usecases/` vazio — lógica ainda acoplada nas rotas
- `etl/transformers/` e `etl/loaders/` vazios — extração direta sem camada de transformação dedicada
- `backend/ml/` vazio — forecasting service importa modelos diretamente
- `backend/services/` vazio — serviços de aplicação não separados
- `notebooks/` vazio — sem notebooks de exploração
- Alembic migrations configurado mas sem migrations criadas (tabelas criadas por `create_all`)
- CORS permite `*` — precisa ser restrito em produção
- `ForecastingService` importa modelos ORM diretamente ao invés de usar repositório

## Próximos passos planejados

1. Implementar testes automatizados (pytest no backend, vitest no frontend)
2. Separar lógica de negócio das rotas para use cases/services
3. Criar transformers ETL dedicados
4. Melhorar tratamento de erros e validações no ETL
5. Configurar Alembic migrations
6. Restringir CORS para domínios conhecidos
7. Adicionar autenticação se necessário

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
