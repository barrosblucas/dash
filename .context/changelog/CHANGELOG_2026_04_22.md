# Changelog — 2026-04-22

## Frontend

### Refatorado: Reformulação visual completa do frontend — design system "The Architectural Archive"

**Escopo:** Todas as páginas, componentes de layout, e componentes de UI foram reescritos seguindo os templates HTML de referência em `frontend/design_system/`.

**Arquivos alterados (40+ arquivos):**

#### Fundação
- `frontend/tailwind.config.js` — Adicionados aliases `font-headline`, `font-label`, cores `background`, `on-background`, Material Design 3 fixed variants (`primary-fixed`, `secondary-fixed`, `surface-tint`, etc.)

#### Componentes de Layout (novos + reescritos)
- `frontend/components/layouts/Sidebar.tsx` — Sidebar com navegação completa (10 itens incluindo Obras), logo "Gestão Municipal", botão "Baixar Dados Abertos", links Suporte/Privacidade
- `frontend/components/layouts/Header.tsx` — Header glassmorphism com backdrop-blur-2xl, search input expansível, theme toggle, settings, "Acesso à Informação" CTA
- `frontend/components/layouts/DashboardLayout.tsx` — Layout com sidebar fixa (md+) e drawer mobile com animação slide-in
- `frontend/components/layouts/PortalHeader.tsx` — **NOVO** Header público com nav links (Início, Painel Financeiro, Obras Públicas, Transparência, Serviços), theme toggle, "Acesso Restrito"
- `frontend/components/layouts/PortalFooter.tsx` — **NOVO** Footer com grid 4 colunas (Portal, Dados, Serviços, Contato) + copyright
- `frontend/components/layouts/index.ts` — Adicionados exports de PortalHeader e PortalFooter

#### Homepage (portal público)
- `frontend/app/portal-client.tsx` — Reescrita completa seguindo `homepage/code.html`: hero com gradient signature texture, badge "BANDEIRANTES - MS", headline, search bar glass, stat cards flutuantes, grid 4 cards de navegação (Painel Financeiro, Obras Públicas, Licitações, Diário Oficial), seção "Acesso Rápido" com 6 cards

#### Obras (novos)
- `frontend/app/obras/page.tsx` — Reescrito com DashboardLayout
- `frontend/app/obras/obras-client.tsx` — **NOVO** Listagem de obras com filtros (Todas/Em Andamento/Concluídas/Planejadas), KPIs (4 cards), grid de cards de obras com progress bar, status badges, meta info
- `frontend/app/obras/[id]/page.tsx` — **NOVO** Server page para detalhe dinâmico
- `frontend/app/obras/[id]/obra-detalhe-client.tsx` — **NOVO** Detalhe da obra com breadcrumb, hero, bento grid (cronograma timeline + info cards), barras de progresso físico/financeiro, documentos

#### Dashboard
- `frontend/app/dashboard/dashboard-client.tsx` — Reescrito com header "Painel Financeiro", seletor de ano, KPIs em grid 2x4, gráficos lado a lado, visão combinada, forecast + comparativo
- `frontend/components/dashboard/KPICard.tsx` — Reescrito com círculos coloridos, trend indicators, Material Symbols
- `frontend/components/dashboard/KPISection.tsx` — Reescrito com grid responsivo, skeleton loading

#### Receitas e Despesas
- `frontend/app/receitas/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/receitas/receitas-client.tsx` — Reescrito com header, KPIs (secondary/green), RevenueChart, tabela
- `frontend/app/despesas/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/despesas/despesas-client.tsx` — Reescrito com header, KPIs (error/red), ExpenseChart, breakdown por categoria com progress bars
- `frontend/components/receitas/ReceitaDetalhamentoTable.tsx` — Reescrito com tonal layering, expand/collapse icons, font-mono para valores

#### Forecast, Comparativo, Relatórios
- `frontend/app/forecast/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/forecast/forecast-client.tsx` — Reescrito com KPIs (tertiary/gold), ForecastSection, insights grid
- `frontend/app/comparativo/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/comparativo/comparativo-client.tsx` — Reescrito com KPIs, trend indicators, ComparativeSection
- `frontend/app/relatorios/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/relatorios/relatorios-client.tsx` — Reescrito com grid 6 cards de exportação (Receitas, Despesas, Balanço, Dados Abertos, Previsões, KPIs)

#### Movimento Extra
- `frontend/app/movimento-extra/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/movimento-extra/movimento-extra-client.tsx` — Reescrito com header, filtros, toggle mensal/anual
- `frontend/app/movimento-extra/kpi-card.tsx` — Reescrito com design system
- `frontend/app/movimento-extra/tipo-pill.tsx` — Reescrito com rounded-full pills
- `frontend/app/movimento-extra/tipo-badge.tsx` — Reescrito com cores semânticas
- `frontend/app/movimento-extra/fundo-card.tsx` — Reescrito com progress bar
- `frontend/app/movimento-extra/item-row.tsx` — Reescrito com responsive layout
- `frontend/app/movimento-extra/insight-card.tsx` — Reescrito com border-l accent
- `frontend/app/movimento-extra/monthly-bar.tsx` — Reescrito com track/fill pattern
- `frontend/app/movimento-extra/mensal-view.tsx` — Reescrito com layout completo
- `frontend/app/movimento-extra/anual-view.tsx` — Reescrito com visão anual

#### Avisos/Licitações
- `frontend/app/avisos-licitacoes/page.tsx` — Atualizado com DashboardLayout
- `frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx` — Reescrito com header, filtros, view toggle
- `frontend/app/avisos-licitacoes/status-badge.tsx` — Reescrito com cores semânticas
- `frontend/app/avisos-licitacoes/fonte-badge.tsx` — Reescrito
- `frontend/app/avisos-licitacoes/licitacao-modal.tsx` — Reescrito com glassmorphism
- `frontend/app/avisos-licitacoes/list-view.tsx` — Reescrito com card grid
- `frontend/app/avisos-licitacoes/month-view.tsx` — Reescrito com calendar grid
- `frontend/app/avisos-licitacoes/week-view.tsx` — Reescrito com day columns

#### Páginas placeholder
- `frontend/components/portal/PlaceholderPage.tsx` — Reescrito com Material Symbols, design system tokens
- `frontend/app/contratos/page.tsx` — Atualizado com Material Symbol icon
- `frontend/app/diarias/page.tsx` — Atualizado com Material Symbol icon
- `frontend/app/licitacoes/page.tsx` — Atualizado com Material Symbol icon

**Design system aplicado:**
- "No-Line Rule": sem `1px solid borders` em nenhum componente
- Superfícies: `bg-surface-container-lowest dark:bg-slate-800/50`
- Sombras: `shadow-ambient` / `shadow-ambient-lg`
- Tipografia: `font-display`/`font-headline` (Manrope), `font-body`/`font-label` (Inter)
- Glassmorphism: `backdrop-blur-2xl` / `backdrop-blur-3xl` em headers e modais
- Cards: `rounded-xl` com hover `shadow-ambient-lg`
- Ícones: `<span className="material-symbols-outlined">` em todos os componentes
- Removida dependência de `framer-motion` — transições via CSS
- Removida dependência de `lucide-react` — substituída por Material Symbols

**Mobile first:**
- Todos os grids usam `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3/4`
- Sidebar vira drawer com overlay em mobile
- Header adaptativo com elementos condensados em mobile
- Touch-friendly com targets mínimos de 44px

**Dark mode:**
- Tema claro e escuro com toggle Sun/Moon
- CSS custom properties para todas as cores (light + dark)
- Store Zustand com persistência em localStorage
- Script anti-FOIT no layout raiz

**Validação final:**
- `npm run lint`: ✅ zero warnings, zero errors
- `tsc --noEmit`: ✅ zero erros de TypeScript
- `npm run build`: ✅ compiled successfully, 16 rotas geradas

---

### Refatorado: Reformulação completa do tema escuro — design system conectado ao Tailwind

**Problema:** O tema escuro tinha cores hardcoded `dark:bg-slate-*`, `dark:text-white`, `dark:text-emerald-*` etc. espalhadas por ~25 componentes. As CSS custom properties do `.dark` no `globals.css` eram ignoradas pelos componentes, criando inconsistência visual e falta de coesão.

**Solução:** Arquitetura de tema escuro baseada em CSS custom properties + Tailwind `rgb(var(...) / <alpha-value>)`.

**Arquivos alterados (27 arquivos):**

#### Fundação
- `frontend/app/globals.css` — Nova paleta dark com variáveis RGB para suporte a opacidade. Superfícies mais neutras e diferenciadas, texto com maior contraste, accent colors mais vibrantes.
- `frontend/tailwind.config.js` — Cores semânticas agora usam `rgb(var(--color-*-rgb) / <alpha-value>)`, alternando automaticamente entre light/dark via CSS custom properties. Paletas fixas (primary-50..900, revenue, expense, forecast) mantidas como hex.

#### Componentes de layout
- `frontend/components/layouts/Sidebar.tsx` — Removido `dark:bg-slate-900`
- `frontend/components/layouts/Header.tsx` — `dark:bg-slate-950/80` → `dark:bg-surface/80`
- `frontend/components/layouts/DashboardLayout.tsx` — Removido `dark:bg-slate-900`
- `frontend/components/layouts/PortalHeader.tsx` — `dark:bg-slate-950/80` → `dark:bg-surface/80`; removido `dark:bg-slate-900`
- `frontend/components/layouts/PortalFooter.tsx` — Removido `dark:bg-slate-900`

#### Componentes de UI
- `frontend/components/dashboard/KPICard.tsx` — Removido `dark:bg-slate-800/50`
- `frontend/components/dashboard/KPISection.tsx` — Removido `dark:bg-slate-800/50`
- `frontend/components/portal/PlaceholderPage.tsx` — Removidos `dark:bg-slate-800/50`, `dark:text-white`, `dark:text-slate-400`
- `frontend/components/receitas/ReceitaDetalhamentoTable.tsx` — Removidos `dark:bg-slate-*` e `dark:hover:bg-slate-*`

#### Páginas — Avisos/Licitações
- `avisos-licitacoes-client.tsx` — Removidos ~20 overrides `dark:bg-slate-*`, `dark:text-white`, `dark:text-emerald-400`, `dark:text-red-400`
- `month-view.tsx` — Removidos ~15 overrides
- `week-view.tsx` — Removidos ~12 overrides
- `list-view.tsx` — Removidos ~10 overrides
- `licitacao-modal.tsx` — `dark:bg-slate-800/95` → `dark:bg-surface-container/95`; removidos ~15 overrides
- `status-badge.tsx` — `dark:bg-emerald-900/30` → `dark:bg-secondary/10`; `dark:bg-red-900/30` → `dark:bg-error/10`
- `fonte-badge.tsx` — Removidos `dark:bg-slate-700/40 dark:text-slate-300`

#### Páginas — Movimento Extra
- `movimento-extra-client.tsx`, `mensal-view.tsx`, `anual-view.tsx`, `fundo-card.tsx`, `insight-card.tsx`, `item-row.tsx`, `monthly-bar.tsx`, `kpi-card.tsx` — Removidos todos os `dark:bg-slate-*`, `dark:text-white`, `dark:text-emerald-*`, `dark:text-red-*`
- `tipo-badge.tsx` — `dark:bg-emerald-900/30` → `dark:bg-secondary/10`; `dark:bg-red-900/30` → `dark:bg-error/10`
- `tipo-pill.tsx` — Removidos `dark:bg-primary/80 dark:text-white` e `dark:bg-slate-700/40 dark:text-slate-300`

#### Páginas — Demais módulos
- `despesas-client.tsx` — Removidos ~10 overrides
- `receitas-client.tsx` — Removidos ~5 overrides
- `forecast-client.tsx` — Removidos ~11 overrides
- `comparativo-client.tsx` — Removidos ~6 overrides
- `relatorios-client.tsx` — Removidos ~5 overrides
- `dashboard-client.tsx` — Removidos ~4 overrides
- `obras-client.tsx` — Removidos ~13 overrides; preservado `dark:shadow-none`
- `obra-detalhe-client.tsx` — Removidos ~24 overrides; preservado `dark:shadow-none`
- `portal-client.tsx` — Removidos ~8 overrides

**Nova paleta dark:**
- Superfícies: neutro-escuro com toque sutil de navy (#111318 → #2c2f3a), melhor diferenciação entre níveis
- Texto: alto contraste (#e3e4ea on-surface, #9094a1 variant) para legibilidade de dados financeiros
- Primary: azul mais brilhante (#a8c8ff) para contraste em fundo escuro
- Secondary: verde vibrante (#6ddba8) para indicadores positivos
- Tertiary: dourado quente (#e0c56e) para destaques
- Error: vermelho claro (#ffb4ab) para alertas

**Validação final:**
- Override check: ✅ zero `dark:bg-slate-*` / `dark:text-slate-*` / `dark:text-white` restantes
- `npm run lint`: ✅ zero warnings, zero errors
- `npm run build`: ✅ compiled successfully, 16 rotas geradas
