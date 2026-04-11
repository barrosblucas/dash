# PROJECT_STATE

Snapshot: 2026-04-11

## Status geral

Projeto em **bootstrap funcional** com pipeline ETL operacional e dashboard interativo.

## Funcionalidade implementada

### Backend
- [x] API FastAPI rodando na porta 8000 com prefixo `/api/v1`
- [x] Health check (`GET /health`)
- [x] Endpoints de receitas (listagem, totais por ano/mês, categorias)
- [x] Endpoints de despesas (listagem, totais por ano/mês)
- [x] Endpoints de KPIs (resumo, mensal, anual)
- [x] Endpoints de forecast (receitas, despesas)
- [x] Endpoints de exportação (PDF, Excel)
- [x] Schemas Pydantic para todas as bordas
- [x] Entidades de domínio com validação (Receita, Despesa)
- [x] Pipeline ETL de extração de PDFs (pdfplumber)
- [x] Forecasting com Prophet + fallback para projeção linear
- [x] Banco SQLite com modelos ORM (receitas, despesas, forecasts, metadata_etl)

### Frontend
- [x] App Next.js rodando na porta 3000
- [x] Dashboard principal com visualização financeira
- [x] API client Axios centralizado
- [x] Hooks customizados (useDashboardData, useFinanceData, useExport)
- [x] Store de filtros (Zustand)
- [x] Componentes de gráficos, KPI e dashboard
- [x] Dark finance theme com Tailwind CSS
- [x] Tipos TypeScript espelhando schemas da API

### Dados
- [x] Receitas: ~160 registros (2013–2026) extraídos de PDFs
- [x] Despesas: ~250 registros (2013–2026) extraídos de PDFs
- [x] Forecasts: pendente de geração
- [x] Metadata ETL: controle de processamento

## Débito técnico conhecido

### Gates de governança (violadores)

**File length (6 arquivos acima do limite):**
- `backend/etl/extractors/pdf_extractor.py` — 655 linhas (limite: 400)
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

- Testes `test_api/`, `test_etl/`, `test_ml/` ainda vazios — sem cobertura automatizada
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

- Backend: `http://localhost:8000` | Docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`
- Banco: `/home/thanos/dashboard/database/dashboard.db`
- Scripts: `bash dev.sh` (menu) ou `bash start.sh` (inicialização rápida)
