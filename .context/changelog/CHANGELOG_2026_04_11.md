# CHANGELOG 2026-04-11

## Governança AI-Native do repositório

Criação dos documentos de governança adaptados para a stack dual (Python/FastAPI + Next.js/TypeScript) do Dashboard Financeiro Municipal, mantendo os princípios AI-Native, AI-Coded e LLM-Friendly do repositório de referência.

### Arquivos criados
- `.context/AI-GOVERNANCE.md` — regras canônicas de implementação, qualidade e segurança
- `.context/architecture.md` — visão arquitetural de referência com camadas e fronteiras
- `.context/REPOMAP.md` — mapa da estrutura real do repositório
- `.context/PROJECT_STATE.md` — estado atual do projeto com débito técnico conhecido
- `.context/changelog/CHANGELOG_2026_04_11.md` — este changelog

### Arquivo atualizado
- `AGENTS.md` — fluxo operacional adaptado para a stack dual com comandos de validação corretos

### Conceitos preservados do repositório de referência
- Taxonomia de mudança (`regra_de_negocio`, `borda_externa`, `mudanca_mecanica`)
- Ordem de execução por tipo (test-first, contract-first, same-cycle)
- Gates obrigatórios adaptados para ruff/mypy/pytest + eslint/tsc/build
- Hard rules adaptadas (Pydantic no lugar de Zod, SQLAlchemy no lugar de Prisma)
- Naming convention (inglês técnico, kebab-case/snake_case/PascalCase por contexto)
- Política de testes por função
- Documentação viva obrigatória
- Definition of Done
- Separação de domínio e infraestrutura

---

## CI Gates executáveis

Criação dos scripts de gate de governança que materializam os checks estruturais declarados no AI-GOVERNANCE.md.

### Scripts criados (`scripts/`)
- `check_file_length.py` — bloqueia arquivos acima do hard limit (Python ≤ 400, TS/TSX ≤ 300 linhas)
- `check_frontend_boundaries.py` — bloqueia import de `backend/` no frontend
- `check_no_console.py` — bloqueia `console.*` (TS) e `print()` (Python) em produção
- `check_alembic_migration.py` — exige migration quando `models.py` muda
- `run_governance_gates.py` — runner unificado com flag `--strict`

### Execução
```bash
python scripts/run_governance_gates.py          # warning only
python scripts/run_governance_gates.py --strict  # bloqueia se falhar
```

### Débito técnico identificado pelos gates
- 6 arquivos acima do limite de linhas (refatorar)
- 9 ocorrências de console.log/print em produção (substituir por logger)

---

## Feature-first explícito na governança

Documentação do padrão feature-first (organização por domínio dentro de camadas) no AI-GOVERNANCE.md e architecture.md.

### Atualizado
- `.context/AI-GOVERNANCE.md` — seção Feature-first com regras, padrão backend e frontend
- `.context/architecture.md` — tabela de features atuais e regra de adição de feature
- `.context/REPOMAP.md` — inclusão da seção `scripts/`

---

## Reimportação das receitas 2022 (correção de PDF)

O arquivo `receitas/2022.pdf` foi substituído pela versão correta. Os dados antigos tinham `valor_previsto = 0` para todos os meses, indicando PDF incorreto. A reextração com o novo PDF trouxe os valores corretos de previsto e arrecadado.

### Alteração
- Removidas 12 receitas antigas de 2022 do banco
- Re-extraídos 12 registros do novo `receitas/2022.pdf`
- Previsto anual 2022: R$ 55.429.000,00 (antes R$ 0,00)
- Arrecadado total 2022: R$ 66.414.223,25 (antes R$ 17.152.774,95)

### Arquivos afetados
- `database/dashboard.db` — dados atualizados
- `receitas/2022.pdf` — arquivo substituído pelo usuário

### Classificação
- `mudanca_mecanica` — reimportação de dados sem mudança de código

---

## Seletor de tipo de gráfico + Gráfico combinado (Receitas x Despesas)

Implementação de seletor de tipo de gráfico reutilizável e gráfico combinado de receitas x despesas sobrepostos, com refatoração dos gráficos individuais existentes.

### Classificação
- `borda_externa` (UI) — novos componentes de interação visual
- `mudanca_mecanica` — refatoração dos gráficos existentes para suportar o seletor

### Arquivos criados
- `frontend/components/ui/ChartTypeSelector.tsx` (84 linhas) — componente reutilizável de seletor de tipo de gráfico (bar, line, area, pie)
- `frontend/components/charts/CombinedOverviewChart.tsx` (249 linhas) — gráfico combinado de receitas x despesas com seletor de tipo

### Arquivos modificados
- `frontend/components/charts/RevenueChart.tsx` — refatorado para suportar bar/line/area/pie via `ChartTypeSelector`
- `frontend/components/charts/ExpenseChart.tsx` — refatorado para suportar bar/line/area/pie via `ChartTypeSelector`
- `frontend/components/charts/index.ts` — adicionado export do `CombinedOverviewChart`
- `frontend/components/ui/index.ts` — adicionado export do `ChartTypeSelector` e `ChartTypeOption`
- `frontend/app/dashboard/dashboard-client.tsx` — adicionado `CombinedOverviewChart` ao layout do dashboard
- `frontend/services/api.ts` — corrigido tipagem de retorno das funções de API (`receitasApi`, `despesasApi`, `kpisApi`) — débito técnico

### Impacto para o usuário
1. Todos os gráficos de receitas e despesas agora possuem seletor de tipo (Barras, Linha, Área, Pizza)
2. Novo gráfico "Receitas x Despesas" mostra ambos os dados sobrepostos no mesmo gráfico
3. O gráfico combinado aparece acima dos gráficos individuais no dashboard

### Validação
- `npx tsc --noEmit` ✅
- `npm run build` ✅
- Gates de governança: file length ✅, frontend boundaries ✅

---

## Fix: Comparação ano anterior no gráfico combinado Receitas x Despesas

Correção do bug onde a opção "Comparar com ano anterior" não surtia efeito no gráfico combinado de receitas x despesas. Ao ativar a comparação, o gráfico agora exibe séries do ano corrente e do ano anterior lado a lado em todos os tipos de gráfico (bar, line, area, pie).

### Fixed
- **Gráfico Receitas x Despesas**: Corrigido bug onde a opção "Comparar com ano anterior" não surtia efeito no gráfico combinado. Agora ao ativar a comparação, o gráfico exibe séries do ano corrente e do ano anterior lado a lado em todos os tipos de gráfico (bar, line, area, pie).

### Arquivo modificado
- `frontend/components/charts/CombinedOverviewChart.tsx`

### Classificação
- `borda_externa` — correção de comportamento visual no frontend

---

## Página Receitas Municipais

Criação da página dedicada de receitas no frontend com tabela paginada, cards resumo, gráfico de receitas e exportação.

### Classificação
- `borda_externa` (UI) — nova página de visualização de dados

### Arquivos criados
- `frontend/app/receitas/page.tsx` (11 linhas) — Server Component com metadata
- `frontend/app/receitas/receitas-client.tsx` (260 linhas) — Client Component com toda a lógica

### Funcionalidades
1. Header com filtro de ano e tipo de receita (CORRENTE/CAPITAL/TODOS)
2. 3 cards resumo: Total Arrecadado, Total Previsto, % Execução
3. Gráfico RevenueChart com lazy loading
4. Tabela paginada com colunas: Ano, Mês, Categoria, Tipo, Previsto, Arrecadado, Anulado, % Execução
5. Botões de exportação CSV e JSON
6. Dark theme consistente com o dashboard

### Validação
- `npx tsc --noEmit` ✅
- `npm run build` ✅ (rota `/receitas` gerada com 3.41 kB)

---

## feat: Páginas dedicadas do sidebar — Despesas, Previsões, Comparativo e Relatórios

Implementação das 4 páginas restantes do sidebar e limpeza de links mortos (Configurações, Ajuda). Agora todas as rotas da navegação lateral apontam para páginas funcionais.

### Classificação
- `borda_externa` (UI) — novas páginas de visualização e exportação

### Arquivos criados
- `frontend/app/despesas/page.tsx` — Server Component com metadata
- `frontend/app/despesas/despesas-client.tsx` — Client Component com tabela, filtros, gráfico, paginação e exportação CSV/JSON
- `frontend/app/forecast/page.tsx` — Server Component com metadata
- `frontend/app/forecast/forecast-client.tsx` — Client Component com projeção configurável (anos), cards de tendência
- `frontend/app/comparativo/page.tsx` — Server Component com metadata
- `frontend/app/comparativo/comparativo-client.tsx` — Client Component com tabela ano-a-ano e estatísticas resumo
- `frontend/app/relatorios/page.tsx` — Server Component com metadata
- `frontend/app/relatorios/relatorios-client.tsx` — Client Component com exportação CSV/JSON para receitas, despesas e KPIs

### Arquivos modificados
- `frontend/components/layouts/Sidebar.tsx` — removidos links mortos (Configurações, Ajuda), imports não usados (Settings, HelpCircle), `secondaryNavigation` e divisor sem conteúdo

### Funcionalidades por página
1. **Despesas** (`/despesas`): tabela paginada, filtro de ano e categoria, gráfico, exportação CSV/JSON
2. **Previsões** (`/forecast`): anos de projeção configuráveis, cards de tendência (crescimento receita, despesa, saldo projetado)
3. **Comparativo** (`/comparativo`): tabela ano-a-ano com receitas, despesas, saldo, variação percentual e estatísticas resumo
4. **Relatórios** (`/relatorios`): centro de exportação com download CSV/JSON para receitas, despesas e KPIs

### Impacto para o usuário
- Sidebar 100% funcional — nenhum link morto
- 5 páginas dedicadas com filtros, gráficos e exportação
- Navegação consistente com o dark theme do dashboard

---

## fix: CORS redirect + serialização de receitas + configuração de rede

Correção de três bugs que impediam o acesso do frontend às APIs quando acessado via IP da rede local (192.168.1.21:3000).

### Problemas corrigidos

1. **CORS redirect (307)**: O FastAPI redirecionava `/api/v1/receitas` → `/api/v1/receitas/` (trailing slash). O redirect perdia os headers CORS, bloqueando o browser. Corrigido com `redirect_slashes=False` no `FastAPI()`.

2. **Serialização de tipo de receita**: O campo `tipo` na entidade de domínio usava `.value` (ex: `RECEITAS CORRENTES`) mas o schema Pydantic esperava `.name` (ex: `CORRENTE`). Corrigido de `r.tipo.value` para `r.tipo.name` nas rotas e endpoints.

3. **Backend bindado em 127.0.0.1**: O `start.sh` e `dev.sh` iniciavam uvicorn em `--host 127.0.0.1`, impedindo acesso de outros dispositivos na rede. Corrigido para `--host 0.0.0.0`. O Next.js também foi corrigido para `--hostname 0.0.0.0`.

4. **Frontend API URL**: O `.env.local` apontava para `http://localhost:8000`, inacessível do dispositivo cliente. Corrigido para `http://192.168.1.21:8000`.

5. **Trailing slashes em hardcoded URLs**: Removidas trailing slashes de todas as URLs hardcoded no frontend (`/api/v1/kpis/anual/` → `/api/v1/kpis/anual`, `/api/v1/kpis/resumo/` → `/api/v1/kpis/resumo`, etc.)

### Backend — arquivos modificados
- `backend/api/main.py` — adicionado `redirect_slashes=False` no `FastAPI()`
- `backend/api/routes/receitas.py` — `tipo=r.tipo.value` → `tipo=r.tipo.name`; `@router.get("/")` → `@router.get("")`
- `backend/api/routes/despesas.py` — `@router.get("/")` → `@router.get("")`
- `backend/api/routes/kpis.py` — `@router.get("/")` → `@router.get("")`; `/anual/` → `/anual`; `/resumo/` → `/resumo`
- `start.sh` — `--host 127.0.0.1` → `--host 0.0.0.0`; `next dev --port 3000` → `next dev --port 3000 --hostname 0.0.0.0`
- `dev.sh` — mesmo padrão de bind

### Frontend — arquivos modificados
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL` apontando para `http://192.168.1.21:8000`
- `frontend/services/api.ts` — removidas trailing slashes de URLs hardcoded (`/kpis/anual/` → `/kpis/anual`, `/kpis/resumo/` → `/kpis/resumo`, `/receitas/categorias/` → `/receitas/categorias`)
- `frontend/lib/constants.ts` — removidas trailing slashes (`/kpis/anual/` → `/kpis/anual`, `/kpis/mensal/` → `/kpis/mensal`)
- `frontend/components/dashboard/KPISection.tsx` — `/api/v1/kpis/` → `/api/v1/kpis`
- `frontend/components/dashboard/ForecastSection.tsx` — `/api/v1/kpis/anual/?` → `/api/v1/kpis/anual?`
- `frontend/components/dashboard/ComparativeSection.tsx` — `/api/v1/kpis/anual/?` → `/api/v1/kpis/anual?`
- `frontend/app/forecast/forecast-client.tsx` — `/api/v1/kpis/anual/?` → `/api/v1/kpis/anual?`
- `frontend/app/comparativo/comparativo-client.tsx` — `/api/v1/kpis/anual/?` → `/api/v1/kpis/anual?`

### Classificação
- `borda_externa` — correção de contratos de API e configuração de deploy
