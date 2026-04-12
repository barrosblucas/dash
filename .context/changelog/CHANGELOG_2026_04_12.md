# Changelog — 2026-04-12

## feat: Tema claro para o dashboard financeiro

### Objetivo
Implementar tema claro (light mode) no dashboard, mantendo o tema escuro existente sem nenhuma alteração visual. Toggle disponível no header via ícone Sun/Moon.

### Abordagem técnica
Utilizou-se CSS custom properties com suporte a alpha (`rgb(var(--color-dark-*) / <alpha-value>)`) no Tailwind. A paleta `dark-*` é invertida no `:root` (light) e mantida exata no `.dark`. Isso permite que ~250 referências a classes `bg-dark-*`, `text-dark-*`, `border-dark-*` em 20+ componentes se adaptem automaticamente sem alterar código de componente.

### Arquivos criados
- `frontend/stores/themeStore.ts` — Store Zustand com persistência em localStorage (`bandeirantes-theme`). Exporta `useThemeStore()` para toggle e `useChartThemeColors()` para cores SVG inline adaptáveis ao tema.

### Arquivos alterados
- `frontend/tailwind.config.js` — Paleta `dark` convertida para CSS variables com alpha support. Sombras `card`/`card-hover` usam CSS vars.
- `frontend/app/globals.css` — Bloco `:root` (light) e `.dark` com 12 CSS variables de cor, sombras e grid de chart. Shimmer adaptativo por tema. Grid Recharts usa `var(--chart-grid-color)`. `::selection` usa `text-dark-100` para inverter corretamente.
- `frontend/app/layout.tsx` — Script inline para prevenir flash de tema incorrido (FOIT). `suppressHydrationWarning` no `<html>`. Sem `className="dark"` hardcoded.
- `frontend/components/layouts/Header.tsx` — Toggle Sun/Moon conectado ao `useThemeStore`. Removido `useState` local.
- `frontend/components/layouts/DashboardLayout.tsx` — Importa `useThemeStore` para overlay adaptativo no mobile sidebar.
- `frontend/components/charts/RevenueChart.tsx` — Importa `useChartThemeColors`. SVG inline colors (tick, grid, pie label) adaptáveis.
- `frontend/components/charts/ExpenseChart.tsx` — Idem. `renderPieLabel` movido para dentro do componente para acessar `chartColors`.
- `frontend/components/charts/CombinedOverviewChart.tsx` — Idem. `AXIS_CFG` e `LEGEND_CFG` movidos para dentro do componente.
- `frontend/components/dashboard/ForecastSection.tsx` — Idem. Cores de eixo/grid/ReferenceLine adaptáveis.
- `frontend/components/dashboard/ComparativeSection.tsx` — Idem. Cores de eixo/grid adaptáveis.

### Classificação
- Tipo: `mudanca_mecanica` (wiring de tema, sem mudança de regra de negócio)
- Domínio: `frontend`

### Validação
- `npm run type-check` ✓ (zero erros)
- `npm run build` ✓ (compilado com sucesso, 9 páginas geradas)
- `npm run lint` — warning pré-existente do `@tanstack/eslint-plugin-query` (não relacionado)
