# AI-GOVERNANCE

Fonte canônica das regras arquiteturais, de qualidade e segurança deste repositório.

## Stack canônica

### Backend (Python)
- Framework: FastAPI com prefixo global `/api/v1`
- Linguagem: Python 3.13 com tipagem estrita (`mypy --strict`)
- Validação: Pydantic v2 para schemas de entrada/saída
- ORM: SQLAlchemy 2.0 (declarative, async-ready)
- Banco: SQLite (desenvolvimento) com Alembic para migrations
- Qualidade: Ruff (lint + format), Black (formatação complementar), mypy (tipagem)
- Testes: pytest + pytest-asyncio + pytest-cov

### Frontend (TypeScript)
- Framework: Next.js 14 (Pages Router)
- Linguagem: TypeScript strict (`strict: true` no tsconfig)
- Estilo: Tailwind CSS
- Estado/Cache: TanStack React Query + Zustand
- HTTP: Axios com client centralizado
- Charts: Recharts + D3.js
- Qualidade: ESLint + Prettier
- Testes: Vitest + jsdom + React Testing Library

### ML/ETL
- Extração: pdfplumber
- Transformação: pandas + numpy
- Forecasting: Prophet + scikit-learn
- Export: reportlab (PDF) + openpyxl (Excel)

## Princípios obrigatórios

- **Contract-first nas bordas externas**: schemas Pydantic definem o contrato da API; types TypeScript definem o contrato do frontend
- **Feature-first na organização de código**: cada feature agrupa seu código por domínio dentro de cada camada (ver seção Feature-first abaixo)
- **Mudanças pequenas, locais e verificáveis**
- **Validação explícita na borda** (entrada com Pydantic, saída serializada)
- **Sem atalhos de tipo**: proibido `any` em TypeScript, proibido `# type: ignore` sem justificativa em Python
- **Separação backend/frontend**: frontend consome backend exclusivamente via HTTP; nunca acessa banco diretamente

## Feature-first (organização por domínio)

O repositório adota **feature-first dentro de camadas**: cada feature (receita, despesa, forecast, etc.) tem seus arquivos nomeados e agrupados por domínio dentro de cada camada da arquitetura.

### Backend — padrão por feature dentro de cada camada

```
backend/
  api/
    routes/
      receitas.py              # Route da feature receita
      despesas.py              # Route da feature despesa
      forecast.py              # Route da feature forecast
      kpis.py                  # Route da feature kpis
      export.py                # Route da feature export
    schemas.py                 # Schemas Pydantic de todas as features
  domain/
    entities/
      receita.py               # Entidade da feature receita
      despesa.py               # Entidade da feature despesa
    repositories/
      receita_repository.py    # Interface da feature receita
    services/
      forecasting_service.py   # Serviço da feature forecast
  infrastructure/
    repositories/
      sql_receita_repository.py    # Implementação da feature receita
      sql_despesa_repository.py    # Implementação da feature despesa
  tests/
    test_api/                  # Testes organizados por feature
    test_etl/                  # Testes organizados por feature
    test_ml/                   # Testes organizados por feature
```

### Frontend — padrão por feature

```
frontend/
  components/
    charts/                    # Componentes de gráficos por feature
    dashboard/                 # Componentes do dashboard
    kpi/                       # Componentes de KPI
    ui/                        # Componentes base (shared)
  hooks/
    useRevenueData.ts          # Hook da feature receita
    useFinanceData.ts          # Hook da feature finança
    useExport.ts               # Hook da feature export
  types/
    receita.ts                 # Tipos da feature receita
    despesa.ts                 # Tipos da feature despesa
  services/
    api.ts                     # API client centralizado (shared)
```

### Regras feature-first

1. **Uma feature = um domínio de negócio** (receita, despesa, forecast, kpi, export)
2. **Não criar features artificiais** só para encaixar num padrão
3. **Shared é exceção, não regra**: só extrair para `lib/`, `utils/` ou `ui/` quando houver reuso real e estável entre features
4. **Não usar `utils/` como dumping ground**: se tem lógica de negócio, pertence a uma feature
5. **Testes acompanham a feature**: `tests/test_api/test_receitas.py`, `tests/test_etl/test_pdf_extractor.py`
6. **Manter consistência**: features similares devem seguir a mesma estrutura interna

## Convenção de nomenclatura (obrigatória)

- Use **inglês técnico** em nomes de domínio, feature, rota, pasta e arquivo
- Para segmentos de rota e nomes de feature/pasta, use `kebab-case`
- Evite nomes mistos PT/EN no mesmo contexto

Exemplos esperados:
- `revenue-chart`, `expense-summary`, `forecast-panel`
- `receita_repository.py`, `despesa_service.py`
- `RevenueChart.tsx`, `ExpenseSummaryCard.tsx`

### Naming padrão por tipo

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Pastas e rotas (TS/Python) | `kebab-case` | `price-research/`, `api/v1/forecast/` |
| Componentes React | `PascalCase` | `RevenueChart`, `KpiCard` |
| Classes Python | `PascalCase` | `ForecastingService`, `PDFExtractor` |
| Variáveis/funções (TS) | `camelCase` | `userEmail`, `fetchRevenueData` |
| Variáveis/funções (Python) | `snake_case` | `receita_repository`, `get_monthly_totals` |
| Constantes (TS/Python) | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_FORECAST_HORIZON` |
| Arquivos Python | `snake_case` | `forecasting_service.py`, `pdf_extractor.py` |
| Arquivos TypeScript | `kebab-case` ou `PascalCase` | `api-client.ts`, `RevenueChart.tsx` |

## Hard rules

1. O frontend não importa código de `backend/`
2. O frontend não acessa banco diretamente
3. A API valida payloads com Pydantic e retorna schemas tipados
4. Routes/controllers não implementam regra de negócio — delegam para services
5. Acesso SQLAlchemy fica isolado em camada de repositório (`infrastructure/repositories/`)
6. Segredos não podem ser hardcoded (usar `.env` + `pydantic-settings` no backend, `NEXT_PUBLIC_*` no frontend)
7. Logs não podem expor PII ou payload bruto sensível
8. Entidades de domínio (`domain/entities/`) não dependem de infraestrutura
9. Services de domínio (`domain/services/`) não importam diretamente de `infrastructure/` — usam interfaces de repositório

## Taxonomia de mudança

- `regra_de_negocio`: muda regra/invariante/cálculo de domínio (ex: fórmula de previsão, lógica de rateio de despesas)
- `borda_externa`: muda endpoint, schema Pydantic, tipo TypeScript, integração externa ou job ETL
- `mudanca_mecanica`: wiring/refactor local sem mudança de comportamento (ex: renomear, mover arquivo)

## Ordem de execução por tipo

- `regra_de_negocio`: test-first (pytest no backend, vitest no frontend)
- `borda_externa`: contract-first (schema Pydantic + tipo TS) + testes + implementação mínima
- `mudanca_mecanica`: implementação pequena + teste no mesmo ciclo

## Gates obrigatórios

### Backend (Python)
```bash
cd backend && ruff check . && ruff format --check . && mypy . && pytest
```

### Frontend (TypeScript)
```bash
cd frontend && npm run lint && npm run type-check && npm run build
```

### Checks estruturais (scripts em `scripts/`)

Todos os gates estruturais são executáveis via `python scripts/run_governance_gates.py`.
**O modo strict é o padrão** — gates que falham retornam exit code 1.

| Gate | Script | O que verifica |
|------|--------|---------------|
| Tamanho de arquivo | `scripts/check_file_length.py` | Ver hard limits abaixo |
| Fronteiras | `scripts/check_frontend_boundaries.py` | Frontend não importa de `backend/` |
| Console/Print | `scripts/check_no_console.py` | Sem `console.*` (TS) e `print()` (Python) em produção |
| Migration | `scripts/check_alembic_migration.py` | `models.py` mudou → precisa de migration |

#### Runner unificado
```bash
# Strict por padrão — falhas bloqueiam
python scripts/run_governance_gates.py

# Aviso apenas (NÃO recomendado, apenas para diagnóstico)
python scripts/run_governance_gates.py --warn-only
```

#### Hard limits por tipo de arquivo

| Tipo | Limite | Exceções conhecidas |
|------|--------|-------------------|
| `.py` | 400 linhas | — |
| `.tsx` / `.ts` | 400 linhas | `constants.ts` até 500 |
| `.jsx` / `.js` | 400 linhas | — |

**Regra**: nenhum arquivo de produção pode exceder o hard limit. Arquivos acima do limite
**devem ser refatorados antes do merge** — não existem bypasses automáticos.

#### Exception metadata (apenas para débito técnico documentado)

```python
# governance-exception: file-length reason="motivo explícito" ticket="ABC-123"
```

**Atenção**: exception metadata NÃO isenta o arquivo do gate. Apenas marca como débito
técnico conhecido. O gate continua falhando. A exception é um auxílio de rastreamento,
não um bypass. O arquivo deve ser refatorado o mais rápido possível.

## Política de testes por função (obrigatória)

- Toda função nova criada no código de produção deve vir acompanhada de teste automatizado no mesmo ciclo de entrega
- O teste deve validar comportamento esperado, cenário de erro relevante e caso limite principal
- Não é aceito depender de validação manual de frontend para provar que a função está correta
- Funções de borda (routes/controllers) devem ter teste de integração quando aplicável

### Exceções permitidas (temporárias e explícitas)
- Código gerado automaticamente
- Wiring trivial sem regra de negócio, desde que coberto por teste de nível superior

### Regra operacional
- Nova função sem teste correspondente bloqueia conclusão da tarefa

### Estrutura de testes
```
backend/
  tests/
    test_api/          # Testes de integração das rotas FastAPI
    test_etl/          # Testes do pipeline de extração/transformação
    test_ml/           # Testes dos modelos de forecasting
    conftest.py        # Fixtures compartilhadas (db session, client, etc.)

frontend/
  components/          # Componentes com .test.tsx ao lado
  hooks/               # Hooks com .test.ts ao lado
  __tests__/           # Testes de integração/página (se necessário)
```

## Documentação viva obrigatória

Após mudança relevante, atualizar:
- `.context/changelog/CHANGELOG_YYYY_MM_DD.md`
- `.context/REPOMAP.md` quando estrutura mudar
- `.context/PROJECT_STATE.md` quando estado do projeto mudar
- `.context/architecture.md` quando decisão arquitetural mudar

## Definition of Done

A tarefa só está pronta quando:
1. Mudança classificada pela taxonomia
2. Schemas (Pydantic/TypeScript) sincronizados com implementação (quando aplicável)
3. Testes e validações obrigatórias executados com sucesso
4. Documentação viva atualizada
5. Nenhum gate CI reprovado
