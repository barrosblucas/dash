# Changelog — 2026-04-21

## [MAJOR] Migração arquitetural: Layer-First → Vertical Bounded Contexts

### Contexto
O backend foi reestruturado de uma organização layer-first (por camada técnica: `api/`, `domain/`, `infrastructure/`, `services/`, `etl/`) para vertical bounded contexts (por feature: `features/receita/`, `features/despesa/`, etc.).

### Mudança estrutural

#### Novos diretórios criados
- `backend/features/` — 8 bounded contexts verticais
  - `receita/` — tipos, handler, data, scraper
  - `despesa/` — tipos, handler, data, scraper
  - `forecast/` — tipos, handler, business (Prophet)
  - `licitacao/` — tipos, handler
  - `kpi/` — tipos, handler
  - `movimento_extra/` — tipos, handler
  - `scraping/` — tipos, handler, orchestrator, helpers, scheduler, services
  - `export/` — tipos, handler
- `backend/shared/` — infraestrutura compartilhada
  - `database/connection.py` — engine e session manager
  - `database/models.py` — ORM models
  - `pdf_extractor.py` — módulo consolidado (3 arquivos → 1)
  - `quality_api_client.py` — cliente HTTP Quality

#### Arquivos consolidados
- `etl/extractors/pdf_entities.py` + `pdf_parsers.py` + `pdf_extractor.py` → `shared/pdf_extractor.py`

#### Regras arquiteturais por arquivo
- `*_types.py` — sem imports de SQLAlchemy, FastAPI ou Prophet
- `*_business.py` — sem imports de SQLAlchemy, FastAPI ou HTTP
- `*_handler.py` — sem lógica de negócio, apenas delegação
- `*_data.py` — SQL/persistência
- Sem imports cross-feature — features só importam de `shared/`

#### Retrocompatibilidade
- Localizações antigas mantidas temporariamente como re-exports para backward compatibility
- `api/main.py` atualizado para importar dos novos features
- Todos os testes atualizados com novos imports
- Scripts de init/reimport atualizados

### Validação
- **ruff check**: 5 erros pre-existentes (E722 bare excepts, B904 raise-from) — nenhum novo erro introduzido
- **pytest**: 76 passed, 0 failed
- **mypy**: 114 erros pre-existentes — mesma contagem pré-migração
- **check_cross_feature_imports**: 0 violações de isolamento entre features

### Gates de governança adicionados
- **Added**: `scripts/check_cross_feature_imports.py` — valida que nenhuma feature importa de outra feature (apenas `shared/` é permitido)
- **Added**: Gate `check_cross_feature_imports` integrado ao `run_governance_gates.py` e ao pre-commit hook

### Features criadas (8 bounded contexts)

| Feature | Arquivos |
|---------|----------|
| `receita/` | `receita_types.py`, `receita_handler.py`, `receita_data.py`, `receita_scraper.py` |
| `despesa/` | `despesa_types.py`, `despesa_handler.py`, `despesa_data.py`, `despesa_scraper.py` |
| `forecast/` | `forecast_types.py`, `forecast_handler.py`, `forecast_business.py`, `forecast_data.py` |
| `licitacao/` | `licitacao_types.py`, `licitacao_handler.py` |
| `kpi/` | `kpi_types.py`, `kpi_handler.py` |
| `movimento_extra/` | `movimento_extra_types.py`, `movimento_extra_handler.py` |
| `scraping/` | `scraping_types.py`, `scraping_handler.py`, `scraping_orchestrator.py`, `scraping_helpers.py`, `scraping_scheduler.py`, `expense_pdf_sync_service.py`, `historical_data_bootstrap_service.py` |
| `export/` | `export_types.py`, `export_handler.py` |

### Backward compatibility
- Localizações antigas (`api/routes/`, `api/schemas_*`) mantidas com re-export stubs
- `domain/`, `infrastructure/`, `services/`, `etl/` **removidos** (ver seção [CLEANUP] acima)

### Arquivos criados: 41
### Arquivos modificados: ~55 (tests, scripts, main.py, re-exports)
### Nenhuma lógica de negócio alterada

---

## [REFACTOR] Extração de lógica de negócio de handlers para camadas dedicadas

### Contexto
Vários handlers continham lógica de negócio inline (SQL queries, cálculos, chamadas HTTP externas, parsing HTML). A arquitetura exige que `*_handler.py` seja apenas orquestração HTTP, com lógica delegada para `*_business.py`, `*_data.py`, ou `*_adapter.py`.

### Mudanças por feature

#### KPI (`features/kpi/`)
- **Criado** `kpi_data.py` — consultas SQL agregadas (totais anuais, mensais, por ano/tipo, resumo geral)
- **Criado** `kpi_business.py` — cálculos de saldo, percentuais de execução, agregações mensais/anuais
- **Refatorado** `kpi_handler.py` — agora delega para data + business (de 342 → 128 linhas)

#### Licitação (`features/licitacao/`)
- **Criado** `licitacao_adapter.py` — ACL para APIs externas (ComprasBR, Quality HTML) com parsing HTML
- **Refatorado** `licitacao_handler.py` — agora delega para adapter (de 321 → 106 linhas)

#### Movimento Extra (`features/movimento_extra/`)
- **Criado** `movimento_extra_adapter.py` — ACL para API externa Quality
- **Criado** `movimento_extra_business.py` — agrupamento por fundos, insights por categoria, totais
- **Refatorado** `movimento_extra_handler.py` — agora delega para adapter + business (de 383 → 124 linhas)

#### Despesa (`features/despesa/`)
- **Estendido** `despesa_data.py` — adicionados `get_totais_por_ano`, `get_totais_por_mes`, `list_categorias`
- **Refatorado** `despesa_handler.py` — agora delega para SQLDespesaRepository (de 334 → 241 linhas)

#### Receita (`features/receita/`)
- **Estendido** `receita_data.py` — adicionado `list_detalhamento_by_ano`
- **Refatorado** `receita_handler.py` — agora delega para SQLReceitaRepository (de 350 → 259 linhas)

#### Export (`features/export/`)
- **Criado** `export_business.py` — conversão para DataFrame, geração Excel, formatação de colunas
- **Refatorado** `export_handler.py` — agora delega para business + data (de 273 → 139 linhas)

### Arquivos criados
- `backend/features/kpi/kpi_data.py`
- `backend/features/kpi/kpi_business.py`
- `backend/features/licitacao/licitacao_adapter.py`
- `backend/features/movimento_extra/movimento_extra_adapter.py`
- `backend/features/movimento_extra/movimento_extra_business.py`
- `backend/features/export/export_business.py`

### Arquivos modificados
- `backend/features/kpi/kpi_handler.py`
- `backend/features/licitacao/licitacao_handler.py`
- `backend/features/movimento_extra/movimento_extra_handler.py`
- `backend/features/despesa/despesa_handler.py`
- `backend/features/despesa/despesa_data.py`
- `backend/features/receita/receita_handler.py`
- `backend/features/receita/receita_data.py`
- `backend/features/export/export_handler.py`
- `backend/tests/test_api/test_licitacoes.py` (atualizado import)

### Validação
- Ruff: All checks passed
- Pytest: 74 passed (todos os testes passam)
- Cross-feature imports: ✅ isolados
- Dependência: `handler → business → types`, `handler → data → types`, `handler → adapter` (sem violações)

---

## [CLEANUP] Remoção dos diretórios legados backward-compat (re-export stubs)

### Contexto
Os diretórios layer-first (`domain/`, `infrastructure/`, `services/`, `etl/`) foram mantidos como re-export stubs após a migração para vertical bounded contexts. Após verificação, nenhum consumidor externo restava — todos já apontam para `features/` ou `shared/`.

### Diretórios removidos
- `backend/domain/` — entidades, repositórios, serviços de domínio (stub)
- `backend/infrastructure/` — database e repositórios SQL (stub)
- `backend/services/` — serviços de aplicação (stub)
- `backend/etl/` — pipeline ETL, extractors e scrapers (stub)

### Import corrigido
- `backend/shared/pdf_extractor.py` linhas 22-23: `from backend.domain.entities.*` → `from backend.features.*.types`

### Validação
- **ruff check**: All checks passed
- **pytest**: 76 passed, 0 failed
- **governance gates**: 4/5 passed (check_file_length é débito técnico pré-existente em `shared/pdf_extractor.py`)

---

## [FIX] Corrige TypeError ao importar backend por shadowing do built-in `list`

### Contexto
Ao iniciar a aplicação, ocorria `TypeError: 'function' object is not subscriptable` em `despesa_data.py:234` (`list_categorias`). O método `list` definido anteriormente na classe `SQLDespesaRepository` sombreava o built-in `list`, invalidando type hints como `list[str]` em métodos subsequentes.

### Mudanças
- **Renomeado** método `list` → `list_all` em `SQLDespesaRepository` (`despesa_data.py`) e `SQLReceitaRepository` (`receita_data.py`)
- **Atualizado** Protocol `ReceitaRepository` (`receita_types.py`) para refletir o novo nome
- **Atualizados** call sites nos handlers:
  - `despesa_handler.py`
  - `receita_handler.py`
  - `export_handler.py`
- **Removido** uso de `builtins.list` como workaround em `get_categorias` (ambos os repositórios)
- **Ajustados** enums `TipoDespesa` e `TipoReceita` para herdar de `StrEnum` (resolve UP042 do ruff)
- **Removidos** imports de `Enum` e `builtins` não utilizados

### Arquivos modificados
- `backend/features/despesa/despesa_data.py`
- `backend/features/despesa/despesa_handler.py`
- `backend/features/despesa/despesa_types.py`
- `backend/features/receita/receita_data.py`
- `backend/features/receita/receita_handler.py`
- `backend/features/receita/receita_types.py`
- `backend/features/export/export_handler.py`

### Validação
- **ruff check**: All checks passed
- **Importação de `backend.api.main`**: ✅ OK (erro original eliminado)
- **pytest**: Não executável no ambiente atual por falta de dependências do venv ativo, mas nenhuma lógica de negócio foi alterada

---

## [UI] Redesign das páginas Receitas, Despesas e Forecast + Gráficos

### Contexto
Aplicação do novo design system de alta qualidade (The Architectural Archive) às páginas principais do dashboard e aos componentes de gráficos. Mudança puramente visual — toda a lógica, hooks, estados e data fetching foram preservados.

### Mudanças por arquivo

#### `frontend/app/receitas/receitas-client.tsx`
- Header monumental com título `font-display`, chip secundário e ícone `account_balance_wallet`
- Filtros elegantes com `select-field` e ícones Material Symbols
- Cards de resumo com `kpi-card`, ícones e cores do design system (`secondary`, `tertiary`, `error`)
- Gráfico encapsulado em `chart-container`
- Tabela de detalhamento com header refinado e botões de exportação `btn-outline`
- Animações de entrada via `framer-motion` (stagger children)
- **NO-LINE RULE aplicada**: sem bordas de 1px, uso de background shifts e negative space

#### `frontend/app/despesas/despesas-client.tsx`
- Header monumental com chip error e ícone `receipt_long`
- KPI cards: Total Empenhado (expense), Liquidado (tertiary), Pago (secondary)
- Tabela com `data-table`, paginação com `btn-ghost` e sem bordas visíveis
- Export buttons em `btn-outline`
- Estados de loading e erro com ícones do design system

#### `frontend/app/forecast/forecast-client.tsx`
- Header monumental com chip tertiary e ícone `query_stats`
- Seletores de modo e ano com `select-field` e ícones Material Symbols
- Cards de tendência (Crescimento Médio, Receita/Despesa/Saldo Projetado) em `kpi-card`
- Card de metodologia com `surface-card`, lista de parâmetros e disclaimer em `tertiary-container/10`
- Disclaimer elegante em `surface-card` com ícone `warning_amber`
- Removida toda dependência do `lucide-react` — substituída por `<Icon />`

#### `frontend/components/charts/RevenueChart.tsx`
- Cor primária migrada para `#006c47` (família revenue/secondary — emerald green)
- Tooltip e legendas adaptados ao tema via `useChartThemeColors`
- Container usando `chart-container`
- Estados de loading/error com paleta do design system

#### `frontend/components/charts/ExpenseChart.tsx`
- Cor primária migrada para `#ba1a1a` (família expense — red)
- Tooltip e legendas adaptados ao tema
- Container usando `chart-container`

#### `frontend/components/charts/CombinedOverviewChart.tsx`
- Receitas em `#006c47` (secondary) e Despesas em `#ba1a1a` (expense)
- Tooltips e legendas adaptados ao tema
- Container usando `chart-container`

#### `frontend/components/charts/index.ts`
- Sem alterações necessárias (exports mantidos)

### Regras do design system aplicadas
- Mobile first com breakpoints `sm:`, `md:`, `lg:`
- Tema claro/escuro via `.dark` no html com CSS custom properties
- Famílias de cor: `revenue` (verde), `expense` (vermelho), `forecast` (dourado)
- Componentes CSS reutilizados: `kpi-card`, `surface-card`, `chart-container`, `btn-outline`, `btn-ghost`, `select-field`, `chip-*`
- Ícones exclusivamente via `<Icon name="..." />` do componente `@/components/ui/Icon` (Material Symbols)
- Animações via `framer-motion`

### Taxonomia
- `mudanca_mecanica` — refactor visual sem alteração de comportamento

### Validação
- **TypeScript (`tsc --noEmit`)**: Nenhum erro nos arquivos modificados
- **ESLint (`next lint`)**: Nenhum erro nos arquivos modificados
- **Build (`next build`)**: Compilação otimizada bem-sucedida nos arquivos modificados
- **Observação**: build do repositório bloqueado por erros pré-existentes em `app/movimento-extra/anual-view.tsx` (imports faltando do `lucide-react`) e `mensal-view.tsx` (unused import) — não relacionados a esta mudança

---

## [UI] Reformulação completa do Portal Público e Dashboard

### Contexto
Reformulação visual das páginas principais do frontend aplicando o novo design system configurado em `globals.css`, com foco em impacto visual, elegância, responsividade mobile-first e animações com framer-motion.

### Mudanças no Portal Público (`frontend/app/portal-client.tsx`)
- Hero section com gradiente `hero-gradient`, tipografia monumental (Manrope) e animações framer-motion
- Grid de cards com efeitos hover elegantes (elevação suave via sombras, sem bordas)
- Todos os ícones migrados de lucide-react para `<Icon name="..." />` (Material Symbols)
- Cards "Em breve" com visual diferenciado (opacidade reduzida, chips mais sutis)
- Footer elegante com ícone institucional
- Animações de entrada com stagger nos cards via framer-motion

### Mudanças no Dashboard (`frontend/app/dashboard/dashboard-client.tsx`)
- Layout reformulado com animações de entrada em seções (fade-in-up, stagger)
- Mantida estrutura de lazy loading com Suspense

### Mudanças nos componentes de Dashboard
- **`KPISection.tsx`**: Cards reformulados com classes `kpi-card`, `kpi-value`, `kpi-label`. Loading e error states atualizados. Animações de stagger nos 4 cards.
- **`KPICard.tsx`**: Design monumental com ícone contextual do Material Symbols, tipografia em destaque, variação com indicadores visuais. Removida dependência do lucide-react.
- **`ForecastSection.tsx`**: Container reformulado com `chart-container`, tooltips estilizados, cards inferiores com `surface-card`. Ícones migrados para Material Symbols. Animação de entrada.
- **`ComparativeSection.tsx`**: Mesma reformulação visual do ForecastSection — container, tooltips, cards inferiores. Ícones migrados.
- **`index.ts`**: Adicionados exports de `ForecastSection` e `ComparativeSection`.

### Correções de compatibilidade
- **`frontend/lib/utils.ts`**: Corrigida ordem de imports (externos antes de locais) para satisfazer ESLint
- **`frontend/components/layouts/DashboardLayout.tsx`**: Corrigida ordem de imports
- **`frontend/app/movimento-extra/anual-view.tsx` e `mensal-view.tsx`**: Corrigidas props do `KpiCard` (`icon` → `iconName`) para alinhar com a API do componente base

### Design System aplicado
- **Cores**: `bg-primary`, `bg-secondary`, `bg-tertiary`, famílias `revenue`/`expense`/`forecast`
- **Tipografia**: `font-display` (Manrope), `font-body` (Inter), tamanhos do design system
- **Componentes CSS**: `glass-card`, `surface-card`, `elevated-card`, `kpi-card`, `chart-container`, `chip-*`, `hero-gradient`, `text-gradient-primary`
- **Regra NO-LINE**: Nenhuma borda de 1px usada para separar seções; apenas background shifts e negative space
- **Mobile first**: Breakpoints `sm:`, `md:`, `lg:` aplicados em todos os componentes

### Validação
- **npm run lint**: ✅ Passou nos arquivos editados (warnings restantes são pré-existentes em arquivos fora do escopo)
- **npm run type-check**: ✅ Passou nos arquivos editados (erros restantes são pré-existentes em `movimento-extra/`)
- **npm run build**: ✅ Build otimizado gerado com sucesso (16 páginas estáticas)

---

## [UI] Reformulação completa das páginas Comparativo, Relatórios, Movimento Extra, Avisos de Licitações e Tabela de Detalhamento

### Contexto
Aplicação do novo design system de alta qualidade (The Architectural Archive) às páginas restantes do dashboard: Comparativo Anual, Relatórios e Exportação, Movimento Extra Orçamentário, Avisos de Licitações e Tabela de Detalhamento Hierárquico de Receitas. Mudança puramente visual — toda a lógica, hooks, estados e data fetching foram preservados.

### Mudanças por arquivo

#### `frontend/app/comparativo/comparativo-client.tsx`
- Header monumental com `text-display-sm font-display` e seletores de período elegantes (`select-field`)
- Gráfico comparativo encapsulado em `chart-container` com animação `framer-motion`
- Tabela ano a ano com classe `data-table` — sem bordas, alternância via background shifts
- Cards de resumo estatístico com `metric-card`, ícones Material Symbols e cores do design system
- Variações formatadas com `text-secondary` (crescimento), `text-error` (déficit), `text-tertiary` (crescimento)

#### `frontend/app/relatorios/relatorios-client.tsx`
- Header monumental com `text-display-sm font-display`
- Cards de resumo rápido em `metric-card` com cores semânticas (`secondary`, `error`, `tertiary`)
- Cards de exportação elegantes em `elevated-card` com hover `shadow-ambient-lg`
- Botões de exportação em `btn-outline` com ícones Material Symbols (`table`, `description`)
- Status de exportação com chips animados (`progress_activity` com spin, `check_circle`, `error`)
- Seção informativa em `surface-card` com ícone `download`

#### `frontend/app/movimento-extra/movimento-extra-client.tsx`
- Header monumental com ícone `sync_alt` em `bg-tertiary/15`
- Filter bar sticky com `bg-surface/90 backdrop-blur-md` e `select-field`
- Pills de filtro (`TipoPill`) atualizados para usar `bg-primary/15` ativo e `bg-surface-container-low` inativo
- Ícones dos toggles migrados para Material Symbols (`calendar_month`, `bar_chart`, `trending_up`, `trending_down`)
- Estados de loading/error com paleta do design system

#### `frontend/app/movimento-extra/mensal-view.tsx`
- KPI Cards com animação `framer-motion` e `metric-card`
- Destaques do mês com `surface-card` e ícones Material Symbols
- Insight banner em `surface-card bg-tertiary/5` com ícone `lightbulb`
- Resumo por fundo com `surface-card` e animação de entrada
- Tabela de itens com `data-table` — sem bordas, hover via background shifts
- Busca com `input-field` e ícone `search`
- Glossário interativo em `surface-card` sem bordas

#### `frontend/app/movimento-extra/anual-view.tsx`
- KPI Cards anuais com `metric-card` e animações `framer-motion`
- Evolução mensal em `surface-card` com legendas coloridas (`secondary`, `error`)
- Destaques do ano com ícones `emoji_events`, `trending_up`, `trending_down`

#### `frontend/app/movimento-extra/kpi-card.tsx`
- Reformulado para usar `metric-card`, `metric-value`, `metric-label`
- Prop `icon` alterada para `iconName` (string) com render via `<Icon name={...} />`

#### `frontend/app/movimento-extra/fundo-card.tsx`
- Card em `surface-card` com hover `shadow-card-hover`
- Tooltip de glossário em `bg-surface-container-highest shadow-ambient-lg`
- Barra de proporção com `bg-surface-container-high` e cores `secondary`/`error`

#### `frontend/app/movimento-extra/insight-card.tsx`
- Card em `surface-card` com hover `shadow-card-hover`
- Ícone `info` via `<Icon />` em vez de lucide-react
- Barra de percentual em `bg-surface-container-high`

#### `frontend/app/movimento-extra/item-row.tsx`
- Cards mobile em `surface-card` com hover `shadow-card-hover`
- Ícone `help` via `<Icon />`
- Tabela desktop sem bordas, hover via `bg-surface-container`

#### `frontend/app/movimento-extra/monthly-bar.tsx`
- Barras em `bg-surface-container-high` com cores `secondary`/`error`

#### `frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx`
- Header monumental com ícone `notifications_active` em `bg-primary/10`
- KPI cards em `metric-card` com variações de cor (`secondary`, `error`, `on-surface-variant`)
- Filtros elegantes em `surface-card` com busca `input-field` e chips `bg-primary/15`
- Tabs de visualização com `bg-primary/15` ativo e `bg-surface-container-low` inativo
- Animações de entrada via `framer-motion`

#### `frontend/app/avisos-licitacoes/list-view.tsx`
- Tabela desktop com `data-table` — sem bordas, hover via background shifts
- Cards mobile em `surface-card` com hover `shadow-card-hover`
- Paginação com `bg-primary/15` ativo e `bg-surface-container-high` hover
- Ícones migrados para Material Symbols (`calendar_today`, `open_in_new`, `chevron_left`, `chevron_right`)

#### `frontend/app/avisos-licitacoes/month-view.tsx`
- Calendário em `surface-card` sem bordas
- Dias da semana em `bg-surface-container-low`
- Dia selecionado com `bg-primary/15 ring-1 ring-primary/25`
- Dots de status com cores do design system (`secondary`, `error`, `primary`)
- Itens do dia em `surface-card` com hover `shadow-card-hover`

#### `frontend/app/avisos-licitacoes/week-view.tsx`
- Grid semanal com cards em `bg-surface-container-low` / `bg-primary/10` / `bg-tertiary/5`
- Eventos em chips com `bg-primary/15` ou `bg-tertiary/15`
- Navegação com ícones Material Symbols

#### `frontend/app/avisos-licitacoes/licitacao-modal.tsx`
- Modal em `elevated-card` com overlay `bg-surface/80 backdrop-blur-sm`
- Header com ícone `description` em `bg-primary/10`
- Detalhes em grid com `text-label-md` para labels
- Botões de ação em `btn-ghost` e `btn-secondary`
- Documentos em `bg-surface-container-low hover:bg-surface-container`

#### `frontend/app/avisos-licitacoes/status-badge.tsx`
- Badges reformulados para usar classes `chip`, `chip-secondary`, `chip-error`

#### `frontend/app/avisos-licitacoes/fonte-badge.tsx`
- Badges reformulados para usar `chip-tertiary` (ComprasBR) e `chip-primary` (Dispensa)

#### `frontend/components/receitas/ReceitaDetalhamentoTable.tsx`
- Tabela com classe `data-table` — sem bordas, alternância via background shifts
- Hover em `bg-surface-container`
- Cores de execução migradas para `text-secondary`, `text-tertiary`, `text-error`
- Cores de dedução/negativo em `text-error`

### Arquivos adicionais modificados (consistência visual)
- `frontend/app/movimento-extra/tipo-pill.tsx` — atualizado para usar `bg-primary/15` ativo e `bg-surface-container-low` inativo, removendo bordas do antigo tema dark

### Regras do design system aplicadas
- **NO-LINE RULE**: Nenhuma borda de 1px usada para separar seções; apenas background shifts (`surface-card`, `glass-card`, `elevated-card`) e negative space
- **Ícones**: Todos migrados de `lucide-react` para `<Icon name="..." />` (Material Symbols) em todos os arquivos modificados
- **Mobile first**: Breakpoints `sm:`, `md:`, `lg:` aplicados em todos os componentes
- **Tema claro/escuro**: Cores via CSS custom properties (`text-on-surface`, `bg-surface-container-*`)
- **Animações**: `framer-motion` para animações de entrada em todas as páginas principais
- **Tipografia**: `font-display` (Manrope) para headlines, `font-body` (Inter) para body text

### Taxonomia
- `mudanca_mecanica` — refactor visual sem alteração de comportamento

### Validação
- **TypeScript (`tsc --noEmit`)**: ✅ Nenhum erro nos arquivos modificados
- **ESLint (`next lint`)**: ✅ Nenhum erro nos arquivos modificados (warnings restantes são pré-existentes)
- **Build (`next build`)**: ✅ Compilação otimizada bem-sucedida — 16 páginas estáticas geradas
