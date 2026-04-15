/**
 * Hooks customizados para React Query
 * Dashboard Financeiro - Bandeirantes MS
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { receitasApi, despesasApi, kpisApi } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { ReceitaDetalhamentoListResponse } from '@/types/receita';

// Tipos de resposta da API
export interface ReceitaResponse {
  id: number | null;
  ano: number;
  mes: number;
  categoria: string;
  subcategoria: string | null;
  tipo: 'CORRENTE' | 'CAPITAL';
  valor_previsto: number;
  valor_arrecadado: number;
  valor_anulado: number;
  fonte: string;
}

export interface ReceitaListResponse {
  receitas: ReceitaResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface DespesaResponse {
  id: number | null;
  ano: number;
  mes: number;
  categoria: string | null;
  subcategoria: string | null;
  tipo: 'CORRENTE' | 'CAPITAL' | 'CONTINGENCIA';
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  fonte: string;
}

export interface DespesaListResponse {
  despesas: DespesaResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface DespesaTotalAnoResponse {
  ano: number;
  tipo: string | null;
  total_empenhado: number;
  total_liquidado: number;
  total_pago: number;
}

export interface KPIMensal {
  mes: number;
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
}

export interface KPIAnual {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  receitas_correntes: number | null;
  receitas_capital: number | null;
  despesas_correntes: number | null;
  despesas_capital: number | null;
}

export interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: KPIMensal[] | null;
  kpis_anuais: KPIAnual[] | null;
}

export interface ResumoResponse {
  total_registros: {
    receitas: number;
    despesas: number;
  };
  anos_disponiveis: {
    receitas: number[];
    despesas: number[];
    todos: number[];
  };
  periodo: {
    inicio: number | null;
    fim: number | null;
  };
  status: string;
}

// ============================================
// Hooks de Receitas
// ============================================

/**
 * Hook para listar receitas com filtros
 */
export function useReceitas(
  params?: {
    ano?: number;
    mes?: number;
    categoria?: string;
    tipo?: string;
    ano_inicio?: number;
    ano_fim?: number;
    limit?: number;
    offset?: number;
  },
  options?: Omit<UseQueryOptions<ReceitaListResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ReceitaListResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.receitas.list(params || {}),
    queryFn: () => receitasApi.list(params),
    ...options,
  });
}

/**
 * Hook para buscar receita por ID
 */
export function useReceita(
  id: number,
  options?: Omit<UseQueryOptions<ReceitaResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ReceitaResponse> {
  return useQuery({
    queryKey: [...QUERY_KEYS.receitas.all, 'detail', id],
    queryFn: () => receitasApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook para total de receitas por ano
 */
export function useReceitasTotalAno(
  ano: number,
  tipo?: string,
  options?: Omit<UseQueryOptions<{ ano: number; tipo: string | null; total_arrecadado: number }>, 'queryKey' | 'queryFn'>
): UseQueryResult<{ ano: number; tipo: string | null; total_arrecadado: number }> {
  return useQuery({
    queryKey: [...QUERY_KEYS.receitas.all, 'total', 'ano', ano, tipo],
    queryFn: () => receitasApi.totalByYear(ano, tipo),
    enabled: !!ano,
    ...options,
  });
}

/**
 * Hook para categorias de receitas
 */
export function useReceitasCategorias(
  options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<string[]> {
  return useQuery({
    queryKey: [...QUERY_KEYS.receitas.all, 'categorias'],
    queryFn: () => receitasApi.getCategories(),
    ...options,
  });
}

/**
 * Hook para detalhamento hierárquico de receitas
 */
export function useReceitasDetalhamento(
  ano: number,
  options?: Omit<UseQueryOptions<ReceitaDetalhamentoListResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ReceitaDetalhamentoListResponse> {
  return useQuery({
    queryKey: [...QUERY_KEYS.receitas.all, 'detalhamento', ano],
    queryFn: () => receitasApi.getDetalhamento(ano),
    enabled: !!ano,
    ...options,
  });
}

// ============================================
// Hooks de Despesas
// ============================================

/**
 * Hook para listar despesas com filtros
 */
export function useDespesas(
  params?: {
    ano?: number;
    mes?: number;
    categoria?: string;
    tipo?: string;
    ano_inicio?: number;
    ano_fim?: number;
    limit?: number;
    offset?: number;
  },
  options?: Omit<UseQueryOptions<DespesaListResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<DespesaListResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.despesas.list(params || {}),
    queryFn: () => despesasApi.list(params),
    ...options,
  });
}

/**
 * Hook para buscar despesa por ID
 */
export function useDespesa(
  id: number,
  options?: Omit<UseQueryOptions<DespesaResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<DespesaResponse> {
  return useQuery({
    queryKey: [...QUERY_KEYS.despesas.all, 'detail', id],
    queryFn: () => despesasApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook para total de despesas por ano
 */
export function useDespesasTotalAno(
  ano: number,
  tipo?: string,
  options?: Omit<UseQueryOptions<DespesaTotalAnoResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<DespesaTotalAnoResponse> {
  return useQuery({
    queryKey: [...QUERY_KEYS.despesas.all, 'total', 'ano', ano, tipo],
    queryFn: () => despesasApi.totalByYear(ano, tipo),
    enabled: !!ano,
    ...options,
  });
}

// ============================================
// Hooks de KPIs
// ============================================

/**
 * Hook para KPIs principais
 */
export function useKPIs(
  ano?: number,
  options?: Omit<UseQueryOptions<KPIsResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<KPIsResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary(),
    queryFn: () => kpisApi.getKPIs(ano),
    ...options,
  });
}

/**
 * Hook para KPIs mensais
 */
export function useKPIsMensais(
  ano: number,
  options?: Omit<UseQueryOptions<KPIsResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<KPIsResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.receitas.timeline(ano),
    queryFn: () => kpisApi.getMonthlyKPIs(ano),
    enabled: !!ano,
    ...options,
  });
}

/**
 * Hook para KPIs anuais
 */
export function useKPIsAnuais(
  ano_inicio?: number,
  ano_fim?: number,
  options?: Omit<UseQueryOptions<KPIsResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<KPIsResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.comparativo([ano_inicio || 2016, ano_fim || 2026]),
    queryFn: () => kpisApi.getYearlyKPIs(ano_inicio, ano_fim),
    ...options,
  });
}

/**
 * Hook para resumo geral
 */
export function useResumoGeral(
  options?: Omit<UseQueryOptions<ResumoResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ResumoResponse> {
  return useQuery({
    queryKey: [...QUERY_KEYS.dashboard.all, 'resumo'],
    queryFn: () => kpisApi.getSummary(),
    ...options,
  });
}

// ============================================
// Formatação de dados para gráficos
// ============================================

/**
 * Formata dados de KPIs mensais para gráfico temporal
 */
export function formatKPIsMensaisParaGrafico(kpis: KPIMensal[] | null) {
  if (!kpis) return [];
  
  return kpis.map((kpi) => ({
    mes: kpi.mes,
    ano: kpi.ano,
    receitas: kpi.total_receitas,
    despesas: kpi.total_despesas,
    saldo: kpi.saldo,
    label: `${kpi.mes.toString().padStart(2, '0')}/${kpi.ano}`,
  }));
}

/**
 * Formata dados de KPIs anuais para gráfico comparativo
 */
export function formatKPIsAnuaisParaGrafico(kpis: KPIAnual[] | null) {
  if (!kpis) return [];
  
  return kpis.map((kpi) => ({
    ano: kpi.ano,
    receitas: kpi.total_receitas,
    despesas: kpi.total_despesas,
    saldo: kpi.saldo,
    receitas_correntes: kpi.receitas_correntes || 0,
    receitas_capital: kpi.receitas_capital || 0,
    despesas_correntes: kpi.despesas_correntes || 0,
    despesas_capital: kpi.despesas_capital || 0,
  }));
}

/**
 * Calcula variação percentual
 */
export function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return ((atual - anterior) / anterior) * 100;
}

/**
 * Formata tendência
 */
export function formatarTendencia(variacao: number): 'alta' | 'baixa' | 'estavel' {
  if (variacao > 5) return 'alta';
  if (variacao < -5) return 'baixa';
  return 'estavel';
}