# 🏗️ Arquitetura do Frontend - Dashboard Financeiro Bandeirantes MS

## 📋 Visão Geral

Dashboard financeiro municipal moderno com dark mode, visualização de dados interativa e análise temporal de receitas e despesas de 2016-2026.

---

## 🎨 Design System

### Paleta de Cores - Dark Finance Luxe

#### Base (Dark Theme)
```typescript
dark: {
  950: '#020617',  // Background principal
  900: '#0f172a',  // Cards, containers
  850: '#172033',  // Card hover
  800: '#1e293b',  // Borders, surfaces
  700: '#334155',  // Border hover
  600: '#475569',  // Border focus
  500: '#64748b',  // Text muted
  400: '#94a3b8',  // Text secondary
  300: '#cbd5e1',  // Text primary
  100: '#f1f5f9',  // High contrast text
   50: '#f8fafc',  // White text
}
```

#### Receitas - Verde Vibrante (Crescimento)
```typescript
revenue: {
  accent: '#00ff88',  // Acento principal - Verde néon
       500: '#22c55e',  // Cor principal
        400: '#4ade80',  // Hover
        300: '#86efac',  // Borders
         glow: 'rgba(0, 255, 136, 0.3)',  // Glow effect
}
```

#### Despesas - Laranja/Vermelho Vibrante (Atenção)
```typescript
expense: {
  accent: '#ff6b35',  // Acento principal - Laranja vibrante
       500: '#f97316',  // Cor principal
        400: '#fb923c',  // Hover
        300: '#fdba74',  // Borders
         glow: 'rgba(255, 107, 53, 0.3)',  // Glow effect
}
```

#### Forecast - Azul Ciano (Projeção/Futuro)
```typescript
forecast: {
  accent: '#00d4ff',  // Acento principal - Ciano
       500: '#06b6d4',  // Cor principal
        400: '#22d3ee',  // Hover
        300: '#67e8f9',  // Borders
         glow: 'rgba(0, 212, 255, 0.3)',
}
```

### Tipografia

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],      // UI geral
 display: ['Sora', 'Inter', 'system-ui'],          // KPIs, títulos
   mono: ['JetBrains Mono', 'Fira Code', 'monospace'], // Números, código
}
```

### Animações

```typescript
animation: {
  'fade-in': 'fadeIn 0.5s ease-out',
  'fade-in-up': 'fadeInUp 0.5s ease-out',
  'scale-in': 'scaleIn 0.3s ease-out',
  'glow': 'glow 2s ease-in-out infinite alternate',
  'shimmer': 'shimmer 2s linear infinite',
   'float': 'float 3s ease-in-out infinite',
}
```

---

## 📁 Estrutura de Pastas

```
frontend/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Página principal
│   │   ├── page.tsx            # SSR page
│   │   └── dashboard-client.tsx # Client components
│   ├── receitas/                # Página de receitas
│   ├── despesas/                # Página de despesas
│   ├── forecast/                # Página de previsões
│   ├── comparativo/             # Página comparativa
│   ├── relatorios/              # Página de relatórios
│   ├── layout.tsx               # Layout global
│   └── globals.css              # Estilos globais
│
├── components/                   # Componentes React
│   ├── charts/                  # Gráficos (Recharts/D3)
│   │   ├── RevenueChart.tsx    # Gráfico de receitas
│   │   ├── ExpenseChart.tsx    # Gráfico de despesas
│   │   ├── SankeyChart.tsx     # Fluxo Sankey
│   │   ├── HeatmapChart.tsx    # Heatmap sazonalidade
│   │   ├── ForecastChart.tsx   # Gráfico com bandas
│   │   └── index.ts
│   │
│   ├── dashboard/               # Componentes do dashboard
│   │   ├── KPICard.tsx         # Card de KPI animado
│   │   ├── KPISection.tsx      # Seção de KPIs
│   │   ├── ForecastSection.tsx # Seção de previsões
│   │   ├── ComparativeSection.tsx
│   │   └── index.ts
│   │
│   ├── layouts/                 # Layouts estruturais
│   │   ├── DashboardLayout.tsx # Layout principal
│   │   ├── Header.tsx          # Cabeçalho
│   │   ├── Sidebar.tsx         # Menu lateral
│   │   └── index.ts
│   │
│   └── ui/                      # Componentes UI base
│       ├── LoadingSpinner.tsx  # Loading animado
│       ├── Button.tsx          # Botões
│       ├── Select.tsx          # Selects
│       ├── Modal.tsx           # Modais
│       └── index.ts
│
├── hooks/                        # Custom React Hooks
│   ├── useDashboardData.ts     # Dados do dashboard
│   ├── useRevenueData.ts       # Dados de receitas
│   ├── useExpenseData.ts       # Dados de despesas
│   ├── useForecast.ts          # Previsões
│   └── useExport.ts            # Exportação
│
├── lib/                          # Utilitários e constantes
│   ├── constants.ts            # Constantes globais
│   ├── utils.ts                # Funções utilitárias
│   ├── date.ts                 # Utilitários de data
│   └── index.ts
│
├── types/                        # Tipos TypeScript
│   ├── receita.ts              # Tipos de receita
│   ├── despesa.ts              # Tipos de despesa
│   ├── api.ts                  # Tipos de API
│   ├── charts.ts               # Tipos de gráficos
│   └── index.ts
│
├── public/                       # Arquivos estáticos
│   ├── favicon.ico
│   ├── icon.svg
│   ├── og-image.png
│   └── manifest.json
│
├── .env.example                  # Template de variáveis
├── .env.local                    # Variáveis locais (gitignore)
├── package.json                  # Dependências
├── tsconfig.json                 # Config TypeScript
├── tailwind.config.js            # Config Tailwind
├── next.config.js                # Config Next.js
└── postcss.config.js             # Config PostCSS
```

---

## 🔧 Tecnologias e Dependências

### Core
- **Next.js 14.2+** - App Router com SSR/SSG
- **React 18.3+** - Hooks, Server Components
- **TypeScript 5.4+** - Tipagem estática

### Visualização de Dados
- **Recharts 2.12+** - Gráficos principais (line, area, bar)
- **D3.js 7.9+** - Visualizações complexas (Sankey, Heatmap)

### Styling
- **Tailwind CSS 3.4+** - Utility-first CSS
- **Framer Motion 11+** - Animações complexas

### Data Management
- **TanStack Query 5.45+** - Server state, caching
- **Axios 1.7+** - HTTP client
- **Zustand 4.5+** - Client state

### Utilities
- **date-fns 3.6+** - Manipulação de datas
- **lucide-react 0.394+** - Ícones
- **clsx + tailwind-merge** - Classes dinâmicas

---

## 🎯 Componentes Principais

### 1. KPI Card Animado

```typescript
<KPICard
  data={{
    titulo: 'Receitas Totais',
    valor: 125000000,
    tipo: 'currency',
    variacao: 12.5,
    variacao_tipo: 'positiva',
    tendencia: 'alta',
  }}
  showTrend={true}
  animated={true}
/>
```

**Features:**
- Glassmorphism com gradientes
- Animações de entrada staggered
- Sparkline integrado (opcional)
- Variação com ícone e cor
- Responsivo (mobile-first)

### 2. Gráfico de Área - Receitas

```typescript
<RevenueChart
  data={timeseriesData}
  height={300}
  showForecast={true}
/>
```

**Features:**
- Área com gradiente
- Tooltip customizado
- Animação suave
- Bandas de confiança (quando há forecast)
- Responsivo

### 3. Sankey Diagram - Fluxo Orçamentário

```typescript
<SankeyChart
  nodes={receitaNodes}
  links={fluxoLinks}
  nodeWidth={20}
/>
```

**Features:**
- D3.js integration
- Hover interativo
- Tooltips informativos
- Animação de entrada
- Fluxo visual receita → despesa

### 4. Heatmap - Sazonalidade

```typescript
<HeatmapChart
  data={sazonalidadeData}
  years={[2020, 2021, 2022, 2023, 2024]}
/>
```

**Features:**
- Anos × Meses
- Escala de cores dinâmica
- Tooltips por célula
- Zoom interaction
- Export como imagem

---

## 📊 Padrões de Dados

### Tipos Principais

```typescript
// Receita
interface Receita {
  id: string;
  ano: number;
  mes: number;
  categoria: ReceitaCategoria;
  fonte: ReceitaFonte;
  valor_realizado: number;
  variacao_anterior?: number;
}

// Despesa
interface Despesa {
  id: string;
  ano: number;
  mes: number;
  funcao: DespesaFuncao;
  natureza: DespesaNatureza;
  valor_orcado: number;
  valor_liquidado: number;
}

// KPI
interface KPICardData {
  titulo: string;
  valor: number;
  tipo: 'currency' | 'percent' | 'number';
  variacao?: number;
  tendencia?: 'alta' | 'baixa' | 'estavel';
}
```

---

## 🚀 Performance

### Lazy Loading Strategy

```typescript
// Heavy components lazy loaded
const SankeyChart = dynamic(
  () => import('@/components/charts/SankeyChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const HeatmapChart = dynamic(
  () => import('@/components/charts/HeatmapChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);
```

### React Query Config

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});
```

### Bundle Optimization

```typescript
// next.config.js
experimental: {
  optimizePackageImports: [
    'lucide-react',
    'recharts',
    'd3',
    'framer-motion',
  ],
}
```

---

## 🔐 Segurança

### Headers Configurados

```typescript
// next.config.js
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

### Environment Variables

```typescript
// Público (NEXT_PUBLIC_*)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Dashboard Financeiro

// Privado (servidor)
API_SECRET_KEY=***
```

---

## 📱 Responsividade

### Breakpoints

```typescript
BREAKPOINTS = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
 '2xl': 1536, // Extra large
}
```

### Mobile-First Approach

- Sidebar oculta em mobile (overlay)
- Grid adaptativo (1 col → 4 cols)
- Touch-friendly interactions
- Performance otimizada para 3G

---

## 🧪 Próximos Passos

### Fase 1 - Implementação Base ✅
- [x] Estrutura de pastas
- [x] Configuração (package.json, tsconfig, tailwind, next)
- [x] Tipos TypeScript
- [x] Constantes e utilitários
- [x] Layout base (Header, Sidebar, DashboardLayout)
- [x] KPI Cards animados
- [x] Gráficos básicos (RevenueChart, ExpenseChart)

### Fase 2 - Componentes Avançados
- [ ] Sankey Diagram (D3.js)
- [ ] Heatmap de sazonalidade
- [ ] Gráfico com bandas de confiança (forecast)
- [ ] Treemap de composição
- [ ] Filtros interativos

### Fase 3 - Integração API
- [ ] Setup React Query
- [ ] Hooks de dados
- [ ] Error handling
- [ ] Loading states
- [ ] WebSocket real-time updates

### Fase 4 - Features
- [ ] Exportação de relatórios (PDF, Excel)
- [ ] Compartilhamento de insights
- [ ] Alertas e notificações
- [ ] Dark theme toggle
- [ ] PWA support

### Fase 5 - Otimização
- [ ] Performance profiling
- [ ] Bundle analysis
- [ ] Image optimization
- [ ] Caching strategy
- [ ] SEO meta tags

---

## 📝 Convenções de Código

### Nomenclatura

```typescript
// Componentes: PascalCase
KPICard.tsx
RevenueChart.tsx

// Hooks: camelCase com 'use'
useDashboardData.ts

// Utilitários: camelCase
formatCurrency()
formatDate()

// Constantes: UPPER_SNAKE_CASE
API_ENDPOINTS
QUERY_KEYS

// Tipos: PascalCase
interface Receita {}
type KPICardData = {}
```

### Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'recharts';

// 3. Internal components
import KPICard from '@/components/dashboard/KPICard';

// 4. Internal utilities
import { formatCurrency } from '@/lib/utils';
import { COLORS } from '@/lib/constants';

// 5. Types
import type { KPICardData } from '@/types';
```

---

## 🎨 Estilos

### Tailwind Classes Comuns

```typescript
// Card glassmorphism
'glass-card p-6 transition-all duration-300'

// Glow effects
'shadow-glow-green'
'shadow-glow-orange'
'shadow-glow-blue'

// Animations
'animate-fade-in-up'
'animate-scale-in'
'animate-pulse'

// Gradients
'text-gradient-green'
'bg-gradient-dark'
```

---

## 📚 Referências

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Recharts API](https://recharts.org/en-US/api)
- [D3.js Gallery](https://observablehq.com/@d3/gallery)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Versão:** 0.1.0  
**Última Atualização:** 2025-01-07  
**Status:** Em Desenvolvimento