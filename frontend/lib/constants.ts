/**
 * Constantes e configurações globais
 * Dashboard Financeiro - Bandeirantes MS
 */

// ============================================
// Informações do Município
// ============================================

export const MUNICIPIO = {
  nome: 'Bandeirantes',
  estado: 'MS',
  estado_nome: 'Mato Grosso do Sul',
  codigo_ibge: '5002107',
  fundacao: 1953,
  populacao_estimada: 31000,
  slug: 'bandeirantes-ms',
} as const;

// Período de dados disponíveis
export const PERIODO_DADOS = {
  ano_inicio: 2013,
  ano_fim: 2026,
  anos: Array.from({ length: 14 }, (_, i) => 2013 + i),
} as const;

// ============================================
// Paleta de Cores - Dark Finance Theme
// ============================================

export const COLORS = {
  // Backgrounds
  bg: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    card: '#172033',
    cardHover: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    muted: '#64748b',
    disabled: '#475569',
  },

  // Bordas
  border: {
    default: '#334155',
    hover: '#475569',
    focus: '#64748b',
    accent: '#059669',
  },

  // Receitas - Verde vibrante (crescimento, prosperidade)
  revenue: {
    light: '#bbf7d0',
    DEFAULT: '#22c55e',
    dark: '#16a34a',
    accent: '#059669',
    glow: 'rgba(5, 150, 105, 0.3)',
    chart: {
      primary: '#22c55e',
      gradient: ['#22c55e', '#059669'],
      area: 'rgba(34, 197, 94, 0.2)',
    },
  },

  // Despesas - Laranja/Vermelho vibrante (alerta, atenção)
  expense: {
    light: '#fed7aa',
    DEFAULT: '#f97316',
    dark: '#ea580c',
    accent: '#ff6b35',
    glow: 'rgba(255, 107, 53, 0.3)',
    chart: {
      primary: '#f97316',
      gradient: ['#f97316', '#ff6b35'],
      area: 'rgba(249, 115, 22, 0.2)',
    },
  },

  // Forecast/Accent - Azul ciano (projeção, futuro)
  forecast: {
    light: '#a5f3fc',
    DEFAULT: '#06b6d4',
    dark: '#0891b2',
    accent: '#0891b2',
    glow: 'rgba(8, 145, 178, 0.3)',
    chart: {
      primary: '#06b6d4',
      gradient: ['#06b6d4', '#0891b2'],
      area: 'rgba(6, 182, 212, 0.2)',
      confidence: 'rgba(6, 182, 212, 0.1)',
    },
  },

  // Accent secundário - Roxo (especial, highlight)
  accent: {
    light: '#d8b4fe',
    DEFAULT: '#a855f7',
    dark: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.3)',
  },

  // Status colors
  status: {
    success: '#059669',
    warning: '#f59e0b',
    danger: '#ff6b35',
    info: '#0891b2',
    neutral: '#94a3b8',
  },

  // Gráficos - Paleta completa para múltiplas séries
  chart: {
    // Paleta principal
    primary: ['#22c55e', '#f97316', '#06b6d4', '#a855f7', '#f43f5e'],
    // Paleta expandida para mais séries
    extended: [
      '#22c55e', '#f97316', '#06b6d4', '#a855f7', '#f43f5e',
      '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#14b8a6',
      '#8b5cf6', '#ef4444', '#0ea5e9', '#d946ef', '#facc15',
    ],
    // Cores para heatmap
    heatmap: {
      min: '#1e293b',
      mid: '#475569',
      max: '#22c55e',
      negative: '#f97316',
    },
    // Gradientes comuns
    gradients: {
      green: ['from-green-400', 'to-green-600'],
      orange: ['from-orange-400', 'to-orange-600'],
      blue: ['from-cyan-400', 'to-cyan-600'],
      purple: ['from-purple-400', 'to-purple-600'],
      dark: ['from-dark-800', 'to-dark-900'],
    },
  },
} as const;

// ============================================
// Formatação de Valores
// ============================================

export const FORMATOS = {
  // Moeda brasileira
  currency: {
    locale: 'pt-BR',
    currency: 'BRL',
    compact: {
      // Abreviações para valores grandes
      milhar: {
        valor: 1e3,
        sufixo: ' mil',
        decimais: 0,
      },
      milhao: {
        valor: 1e6,
        sufixo: ' Mi',
        decimais: 1,
      },
      bilhao: {
        valor: 1e9,
        sufixo: ' Bi',
        decimais: 2,
      },
    },
  },

  // Percentuais
  percent: {
    locale: 'pt-BR',
    decimais: 1,
    useGrouping: true,
  },

  // Datas
  date: {
    locale: 'pt-BR',
    formats: {
      short: 'dd/MM/yyyy',
      medium: "dd 'de' MMM 'de' yyyy",
      long: "dd 'de' MMMM 'de' yyyy",
      month: "MMMM 'de' yyyy",
      year: 'yyyy',
      monthShort: 'MMM',
      weekday: 'EEEE',
    },
  },

  // Números
  number: {
    locale: 'pt-BR',
    decimals: { min: 0, max: 2 },
    useGrouping: true,
  },
} as const;

// ============================================
// Labels e Textos
// ============================================

export const LABELS = {
  receita: {
    singular: 'Receita',
    plural: 'Receitas',
    titulo: 'Receitas Municipais',
    subtitulo: 'Arrecadação por fonte e categoria',
  },
  despesa: {
    singular: 'Despesa',
    plural: 'Despesas',
    titulo: 'Despesas Municipais',
    subtitulo: 'Execução orçamentária por função',
  },
  forecast: {
    singular: 'Previsão',
    plural: 'Previsões',
    titulo: 'Previsão',
    subtitulo: 'Projeção baseada em dados históricos',
  },
  comparativo: {
    titulo: 'Comparativo',
    subtitulo: 'Análise comparativa entre períodos',
  },
  sazonalidade: {
    titulo: 'Sazonalidade',
    subtitulo: 'Variação ao longo do tempo',
  },
  kpi: {
    total: 'Total',
    variacao: 'Variação',
    percentual: 'Percentual',
    acumulado: 'Acumulado',
    media: 'Média',
  },
  periodo: {
    ano: 'Ano',
    mes: 'Mês',
    trimestre: 'Trimestre',
    semestre: 'Semestre',
    diário: 'Diário',
  },
  categoria: {
    receita_corrente: 'Receitas Correntes',
    receita_capital: 'Receitas de Capital',
    despesa_corrente: 'Despesas Correntes',
    despesa_capital: 'Despesas de Capital',
  },
  funcoes: {
    administracao: 'Administração',
    saude: 'Saúde',
    educacao: 'Educação',
    assistencia_social: 'Assistência Social',
    transporte: 'Transporte',
    urbanismo: 'Urbanismo',
  },
} as const;

// ============================================
// Nomes dos meses
// ============================================

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

// ============================================
// Intervalo de atualização (ms)
// ============================================

export const REFRESH_INTERVALS = {
  realtime: 5000, // 5 segundos
  frequent: 30000, // 30 segundos
  normal: 60000, // 1 minuto
  slow: 300000, // 5 minutos
  cached: 900000, // 15 minutos
} as const;

// ============================================
// Breakpoints responsivos
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================
// Configuração de gráficos
// ============================================

export const CHART_CONFIG = {
  // Tamanhos padrão
  defaults: {
    width: '100%',
    height: 300,
    margin: { top: 20, right: 30, bottom: 20, left: 0 },
  },
  
  // Animação
  animation: {
    duration: 500,
    ease: 'ease-out',
    delay: 100,
    stagger: 50,
  },
  
  // Tooltip
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  
  // Eixos
  axis: {
    stroke: '#334155',
    tickFill: '#94a3b8',
    gridStroke: '#1e293b',
    fontSize: 12,
  },
  
  // Legenda
  legend: {
    position: 'bottom',
    fontSize: 12,
    iconSize: 10,
  },
  
  // Sankey específico
  sankey: {
    nodeWidth: 20,
    nodePadding: 15,
    linkOpacity: 0.3,
    nodeOpacity: 0.9,
  },
  
  // Heatmap específico
  heatmap: {
    cellSize: 40,
    cellPadding: 2,
    borderRadius: 4,
  },
} as const;

// ============================================
// URLs da API
// ============================================

export const API_ENDPOINTS = {
  // Empty base — all /api/v1/* requests go through Next.js rewrites (same-origin).
  // The server-side auth helper (callIdentityBackend) still reads
  // NEXT_PUBLIC_API_URL directly for its own backend calls.
  base: '',
  
  receitas: {
    list: '/api/v1/receitas',
    aggregated: '/api/v1/receitas/aggregated',
    timeline: '/api/v1/receitas/timeline',
    kpi: '/api/v1/receitas/kpi',
    by_categoria: '/api/v1/receitas/por-categoria',
    by_fonte: '/api/v1/receitas/por-fonte',
    export: '/api/v1/export/receitas/excel',
  },
  
  despesas: {
    list: '/api/v1/despesas',
    aggregated: '/api/v1/despesas/aggregated',
    timeline: '/api/v1/despesas/timeline',
    kpi: '/api/v1/despesas/kpi',
    by_funcao: '/api/v1/despesas/por-funcao',
    by_natureza: '/api/v1/despesas/por-natureza',
    export: '/api/v1/export/despesas/excel',
  },
  
  forecast: {
    receitas: '/api/v1/forecast/receitas',
    despesas: '/api/v1/forecast/despesas',
    confidence: '/api/v1/forecast/confidence',
  },
  
  dashboard: {
    summary: '/api/v1/kpis',
    comparativo: '/api/v1/kpis/anual',
    sazonalidade: '/api/v1/kpis/mensal',
  },
  
  export: {
    receitas_excel: '/api/v1/export/receitas/excel',
    despesas_excel: '/api/v1/export/despesas/excel',
    kpis_excel: '/api/v1/export/kpis/excel',
  },
  
  websocket: {
    real_time: '/ws/realtime',
  },

  movimentoExtra: {
    busca: '/api/v1/movimento-extra/busca',
    anual: '/api/v1/movimento-extra/anual',
  },

  licitacoes: {
    comprasbr: '/api/v1/licitacoes/comprasbr',
    comprasbrDetail: (id: number) => `/api/v1/licitacoes/comprasbr/${id}`,
    dispensas: '/api/v1/licitacoes/dispensas',
  },
  legislacao: {
    list: '/api/v1/legislacao',
    detail: (id: string) => `/api/v1/legislacao/${id}`,
  },
} as const;

// ============================================
// Query Keys para React Query
// ============================================

export const QUERY_KEYS = {
  receitas: {
    all: ['receitas'] as const,
    lists: () => [...QUERY_KEYS.receitas.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QUERY_KEYS.receitas.lists(), filters] as const,
    aggregated: (filters: Record<string, unknown>) => [...QUERY_KEYS.receitas.all, 'aggregated', filters] as const,
    timeline: (year: number) => [...QUERY_KEYS.receitas.all, 'timeline', year] as const,
    kpi: (year: number) => [...QUERY_KEYS.receitas.all, 'kpi', year] as const,
  },
  
  despesas: {
    all: ['despesas'] as const,
    lists: () => [...QUERY_KEYS.despesas.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QUERY_KEYS.despesas.lists(), filters] as const,
    aggregated: (filters: Record<string, unknown>) => [...QUERY_KEYS.despesas.all, 'aggregated', filters] as const,
    timeline: (year: number) => [...QUERY_KEYS.despesas.all, 'timeline', year] as const,
    kpi: (year: number) => [...QUERY_KEYS.despesas.all, 'kpi', year] as const,
  },
  
  forecast: {
    all: ['forecast'] as const,
    receitas: (horizon: number) => [...QUERY_KEYS.forecast.all, 'receitas', horizon] as const,
    despesas: (horizon: number) => [...QUERY_KEYS.forecast.all, 'despesas', horizon] as const,
  },
  
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...QUERY_KEYS.dashboard.all, 'summary'] as const,
    comparativo: (years: number[]) => [...QUERY_KEYS.dashboard.all, 'comparativo', years] as const,
  },

  movimentoExtra: {
    all: ['movimento-extra'] as const,
    busca: (ano: number, mes: number, tipo: string) =>
      [...QUERY_KEYS.movimentoExtra.all, 'busca', ano, mes, tipo] as const,
    anual: (ano: number) => [...QUERY_KEYS.movimentoExtra.all, 'anual', ano] as const,
  },

  licitacoes: {
    all: ['licitacoes'] as const,
    comprasbr: (page: number, size: number) =>
      [...QUERY_KEYS.licitacoes.all, 'comprasbr', page, size] as const,
    comprasbrDetail: (id: number) =>
      [...QUERY_KEYS.licitacoes.all, 'comprasbr-detail', id] as const,
    dispensas: () =>
      [...QUERY_KEYS.licitacoes.all, 'dispensas'] as const,
  },
  legislacao: {
    all: ['legislacao'] as const,
    list: (params: Record<string, unknown>) =>
      [...QUERY_KEYS.legislacao.all, 'list', params] as const,
    detail: (id: string) =>
      [...QUERY_KEYS.legislacao.all, 'detail', id] as const,
  },
} as const;

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  theme: 'bandeirantes-theme',
  filters: 'bandeirantes-filters',
  userPreferences: 'bandeirantes-preferences',
  cachedData: 'bandeirantes-cache',
} as const;