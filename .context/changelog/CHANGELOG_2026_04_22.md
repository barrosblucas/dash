# Changelog — 2026-04-22

## Backend

### Adicionado: bounded context `identity` com autenticação rotativa e administração de usuários

**Escopo:** Backend FastAPI (`/api/v1/identity`), segurança compartilhada e proteção de superfícies administrativas.

**Arquivos criados/alterados:**
- `backend/shared/settings.py` — settings centralizados para CORS explícito, segredos JWT, bootstrap de admin e reset de senha
- `backend/shared/security.py` — hash Argon2, emissão/validação de access token e refresh token, dependências de autenticação/autorização
- `backend/features/identity/identity_types.py` — schemas Pydantic de login, refresh, logout, usuário e reset de senha
- `backend/features/identity/identity_data.py` — persistência de usuários e tokens rotativos/revogáveis + bootstrap do primeiro admin
- `backend/features/identity/identity_handler.py` — rotas de login, refresh, logout, `me`, CRUD básico de usuários e reset de senha
- `backend/shared/database/models.py` — tabelas `users` e `identity_tokens`
- `backend/api/main.py` — registro do router, CORS via settings, sanitização de 500 e proteção de `/admin/*`

**Mudanças principais:**
- access token curto via `Authorization: Bearer`
- refresh token rotativo com `jti` persistido e revogado no servidor
- reset de senha com token assinado de uso único e expiração curta
- bootstrap one-shot do primeiro admin a partir de env/settings quando o banco ainda não possui usuários
- `/admin/reset-database` e `/admin/stats` agora exigem usuário admin autenticado
- handler global de 500 deixou de expor `str(exc)` ao cliente
- CORS deixou de usar `allow_origins=["*"]` com credenciais

**Validação:**
- `cd backend && ruff check .` ✅
- `cd backend && pytest` ✅ (80 testes)
- `cd backend && mypy .` — arquivos novos (`features/identity/`, `features/obra/`, `shared/settings.py`, `shared/security.py`) passam isoladamente; gate global ainda falha por débito legado em `receita/`, `despesa/`, `scraping/` (conhecido e planejado para correção no ciclo seguinte)

---

### Adicionado: bounded context `obra` com CRUD completo e medições filhas

**Escopo:** Backend FastAPI (`/api/v1/obras`) com leitura pública e escrita restrita a admins.

**Arquivos criados/alterados:**
- `backend/features/obra/obra_types.py` — schemas Pydantic de obra e medição
- `backend/features/obra/obra_business.py` — cálculos puros (`valor_economizado`, `valor_medido_total`)
- `backend/features/obra/obra_data.py` — persistência SQLAlchemy de obras e substituição completa de medições no update
- `backend/features/obra/obra_handler.py` — listagem, detalhe, criação, edição e remoção por `hash`
- `backend/shared/database/models.py` — tabelas `obras` e `obra_medicoes`
- `backend/tests/test_api/test_obra.py` — cobertura de CRUD, proteção admin, leitura pública e medições

**Mudanças principais:**
- identificador externo de obra passou a ser `hash` gerado no backend
- status válidos: `em_andamento`, `paralisada`, `concluida`
- payload aceita e retorna coleção `medicoes`
- update substitui integralmente a coleção de medições enviada
- `valor_economizado` e `valor_medido_total` são calculados e retornados pela API

**Validação:**
- `cd backend && ruff check .` ✅
- `cd backend && pytest` ✅ (80 testes)
- `cd backend && mypy <arquivos novos>` ✅

## Frontend

### Adicionado: Área administrativa com autenticação isolada e CRUD de obras/usuários

**Escopo:** frontend administrativo (`/login`, `/admin/*`), borda de autenticação via route handlers e substituição dos mocks públicos de obras por consumo real da API.

**Arquivos-chave:**
- `frontend/middleware.ts` — proteção de navegação para `/admin` baseada em cookie HttpOnly de refresh
- `frontend/app/api/auth/*` + `frontend/lib/auth-server.ts` — borda `login/session/logout` para conversar com `/api/v1/identity/*`
- `frontend/stores/authStore.ts` + `frontend/services/auth-service.ts` — sessão client-side com access token apenas em memória
- `frontend/components/admin/**` + `frontend/app/admin/**` — layout administrativo separado, gestão de usuários e CRUD completo de obras com medições dinâmicas
- `frontend/services/obra-service.ts`, `frontend/services/user-service.ts`, `frontend/types/{identity,user,obra}.ts` — contratos TS e serviços dedicados
- `frontend/app/obras/obras-client.tsx` + `frontend/app/obras/[id]/obra-detalhe-client.tsx` — consumo real da API de obras no portal público
- `frontend/components/layouts/PortalHeader.tsx` — CTA “Acesso Restrito” apontando para `/login`

**Decisões relevantes:**
- access token fica exclusivamente em memória no frontend; refresh token permanece em cookie `HttpOnly` seguro controlado pelos route handlers
- middleware protege apenas a navegação de `/admin`; autorização efetiva continua delegada ao backend
- layout administrativo foi separado da navegação pública para reduzir ambiguidade entre área aberta e área restrita
- `valor_economizado` permanece somente leitura nos fluxos público e administrativo

**Validação final:**
- `cd frontend && npm run lint`: ✅ sem warnings ou erros
- `cd frontend && npm run type-check`: ✅ sem erros
- `cd frontend && npm run build`: ✅ sucesso (mantido warning pré-existente de `metadataBase` ausente)

---

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

---

### Alterado: Página de detalhe de obra — galeria de fotos substitui cronograma

**Escopo:** Página de detalhamento de obra (`/obras/[id]`).

**Arquivo alterado:**
- `frontend/app/obras/[id]/obra-detalhe-client.tsx`

**Mudanças:**
- **Removido** mock de dados do cronograma e seção "Cronograma" (timeline com etapas)
- **Adicionado** mock de galeria de fotos (6 fotos com legenda)
- **Adicionado** componente `PhotoGallery` com foto principal grande (aspect 16:9), legenda overlay, contador e grid de thumbnails clicáveis
- **Migrado** de `<img>` para `<Image>` do `next/image` com `unoptimized` (URLs externas)
- **Adicionado** `useState` para controle da foto selecionada

**Validação:**
- `npm run lint`: ✅ zero warnings, zero errors
- `tsc --noEmit`: ✅ zero erros
- `npm run build`: ✅ compiled successfully

---

### Corrigido: reconciliação frontend/backend e jornada de reset de senha

**Escopo:** Ajustes de contrato, segurança de rota admin e conclusão do fluxo de reset de senha.

**Arquivos alterados/criados:**
- `frontend/services/obra-service.ts` — parser de valores decimais retornados como string pelo backend para `number`
- `frontend/lib/obra-formatters.ts` — `formatCurrency` agora aceita `number | string | null | undefined`
- `frontend/types/identity.ts` — tipos para consumo de reset de senha (`PasswordResetConsumeRequest/Response`)
- `frontend/services/auth-service.ts` — `consumePasswordReset` integrado com `POST /api/v1/identity/password-resets/consume`
- `frontend/components/admin/AdminShell.tsx` — redirecionamento de não-admin para `/dashboard` e bloqueio de renderização
- `frontend/app/reset-password/page.tsx` + `frontend/components/auth/ResetPasswordPageClient.tsx` — página pública para redefinir senha a partir do token/link gerado no admin

**Mudanças principais:**
- contrato de obras agora é tolerante a `Decimal` serializado como string pelo backend
- `AdminShell` protege a área admin não apenas por cookie, mas também por `role === 'admin'`
- jornada de reset de senha está completa: admin gera link → usuário acessa `/reset-password?token=...` → consome token → redireciona para login

**Validação final:**
- `cd frontend && npm run lint` ✅
- `cd frontend && npm run type-check` ✅
- `cd frontend && npm run build` ✅
