/**
 * Tipos para APIs, respostas e payloads
 * Dashboard Financeiro - Bandeirantes MS
 */

import type { Receita, ReceitaAgregada, ReceitaFiltro, ReceitaKPI, ReceitaTimeline } from './receita';
import type { Despesa, DespesaAgregada, DespesaFiltro, DespesaKPI, DespesaTimeline } from './despesa';

// ============================================
// API Response Types
// ============================================

// Resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

// Metadados de paginação
export interface ResponseMetadata {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Erro da API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================
// Dashboard Types
// ============================================

// Dados resumidos do dashboard
export interface DashboardSummary {
  referencia: Date;
  atualizado_em: Date;
  
  receitas: {
    total_ano: number;
    total_mes: number;
    variacao_ano_anterior: number;
    percentual_realizacao: number;
    top_fontes: Array<{
      fonte: string;
      valor: number;
      percentual: number;
    }>;
  };
  
  despesas: {
    total_ano: number;
    total_mes: number;
    variacao_ano_anterior: number;
    taxa_execucao: number;
    top_funcoes: Array<{
      funcao: string;
      valor: number;
      percentual: number;
    }>;
  };
  
  saldo: {
    valor: number;
    variacao: number;
    tendencia: 'positiva' | 'negativa' | 'estavel';
  };
  
  alertas: Array<{
    id: string;
    tipo: 'info' | 'warning' | 'danger';
    mensagem: string;
    valor?: number;
  }>;
}

// ============================================
// Forecast Types
// ============================================

// Previsão com intervalo de confiança
export interface ForecastResult {
  data: Date;
  valor_previsto: number;
  intervalo_inferior: number;
  intervalo_superior: number;
  confianca: number; // 80, 90, 95
  tendencia: 'alta' | 'baixa' | 'estavel';
}

// Parâmetros do modelo de previsão
export interface ForecastParams {
  horizonte_meses: number;
  nivel_confianca: number;
  modelo: 'holt_winters' | 'arima' | 'prophet' | 'ensemble';
  incluir_sazonalidade: boolean;
}

// ============================================
// Chart Data Types
// ============================================

// Dados para line chart
export interface LineChartData {
  data: Date;
  series: Array<{
    nome: string;
    valor: number;
    cor?: string;
  }>;
}

// Dados para area chart com bandas
export interface AreaChartData {
  data: Date;
  atual: number;
  previsto: number;
  intervalo_inferior?: number;
  intervalo_superior?: number;
}

// Dados para Sankey flow
export interface SankeyNode {
  id: string;
  nome: string;
  categoria: 'receita' | 'despesa' | 'funcao';
  valor: number;
  cor: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  percentual: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Dados para heatmap
export interface HeatmapData {
  mes: number;
  ano: number;
  valor: number;
  intensidade: number; // 0-1
  label?: string;
}

// Dados para treemap
export interface TreemapData {
  id: string;
  nome: string;
  valor: number;
  percentual: number;
  pai?: string;
  filhos?: TreemapData[];
  cor: string;
}

// ============================================
// Time Series Types
// ============================================

// Série temporal genérica
export interface TimeSeries {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  valores: Array<{
    data: Date;
    valor: number;
    observacao?: string;
  }>;
  metadata?: Record<string, unknown>;
}

// Dados comparativos multi-anos
export interface ComparativoAnual {
  anos: number[];
  meses: number[];
  dados: Array<{
    ano: number;
    mes: number;
    receita: number;
    despesa: number;
    saldo: number;
  }>;
}

// ============================================
// Filter Types
// ============================================

// Filtros do dashboard
export interface DashboardFilter {
  ano?: number | number[];
  mes?: number | number[];
  periodo_inicio?: Date;
  periodo_fim?: Date;
  comparar_com?: 'ano_anterior' | 'periodo_anterior' | 'media_historica';
}

// Estado dos filtros
export interface FilterState {
  receita: ReceitaFiltro;
  despesa: DespesaFiltro;
  dashboard: DashboardFilter;
}

// ============================================
// Real-time Types
// ============================================

// WebSocket message
export interface WSMessage<T = unknown> {
  type: 'receita_update' | 'despesa_update' | 'forecast_update' | 'alert';
  payload: T;
  timestamp: Date;
}

// State de loading
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Cache keys para React Query
export type QueryKeys = 
  | ['dashboard', 'summary']
  | ['receitas', 'list', ReceitaFiltro]
  | ['receitas', 'aggregated', ReceitaFiltro]
  | ['receitas', 'timeline', number, number]
  | ['receitas', 'kpi', number]
  | ['despesas', 'list', DespesaFiltro]
  | ['despesas', 'aggregated', DespesaFiltro]
  | ['despesas', 'timeline', number, number]
  | ['despesas', 'kpi', number]
  | ['forecast', 'receitas', number]
  | ['forecast', 'despesas', number];