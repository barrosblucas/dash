/**
 * Store global para filtros do dashboard
 * Dashboard Financeiro - Bandeirantes MS
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos de filtros disponíveis
export type TipoReceita = 'CORRENTE' | 'CAPITAL' | 'TODOS';
export type TipoDespesa = 'CORRENTE' | 'CAPITAL' | 'CONTINGENCIA' | 'TODOS';

export interface FiltrosDashboard {
  // Filtro de ano
  anoSelecionado: number;
  anoInicio: number | null;
  anoFim: number | null;
  
  // Filtro de período personalizado
  periodoPersonalizado: boolean;
  
  // Filtros de receitas
  tipoReceita: TipoReceita;
  categoriaReceita: string | null;
  
  // Filtros de despesas
  tipoDespesa: TipoDespesa;
  categoriaDespesa: string | null;
  
  // Filtros de comparação
  compararComAnoAnterior: boolean;
  mostrarProjecao: boolean;
  
  // Modo de visualização
  modoVisualizacao: 'mes' | 'trimestre' | 'semestre' | 'ano';
}

interface DashboardFiltersActions {
  // Ações
  setAnoSelecionado: (ano: number) => void;
  setPeriodoPersonalizado: (inicio: number, fim: number) => void;
  clearPeriodoPersonalizado: () => void;
  setTipoReceita: (tipo: TipoReceita) => void;
  setTipoDespesa: (tipo: TipoDespesa) => void;
  setCategoriaReceita: (categoria: string | null) => void;
  setCategoriaDespesa: (categoria: string | null) => void;
  toggleCompararAnoAnterior: () => void;
  toggleMostrarProjecao: () => void;
  setMostrarProjecao: (mostrar: boolean) => void;
  setModoVisualizacao: (modo: 'mes' | 'trimestre' | 'semestre' | 'ano') => void;
  resetFilters: () => void;
}

// Estado inicial
const initialState: FiltrosDashboard = {
  anoSelecionado: new Date().getFullYear(),
  anoInicio: null,
  anoFim: null,
  periodoPersonalizado: false,
  tipoReceita: 'TODOS',
  categoriaReceita: null,
  tipoDespesa: 'TODOS',
  categoriaDespesa: null,
  compararComAnoAnterior: false,
  mostrarProjecao: false,
  modoVisualizacao: 'ano',
};

// Store
export const useDashboardFilters = create<FiltrosDashboard & DashboardFiltersActions>()(
  persist(
    (set) => ({
      ...initialState,

      setAnoSelecionado: (ano) => set({ 
        anoSelecionado: ano,
        periodoPersonalizado: false,
      }),

      setPeriodoPersonalizado: (inicio, fim) => set({
        anoInicio: inicio,
        anoFim: fim,
        periodoPersonalizado: true,
      }),

      clearPeriodoPersonalizado: () => set({
        anoInicio: null,
        anoFim: null,
        periodoPersonalizado: false,
      }),

      setTipoReceita: (tipo) => set({ tipoReceita: tipo }),

      setTipoDespesa: (tipo) => set({ tipoDespesa: tipo }),

      setCategoriaReceita: (categoria) => set({ categoriaReceita: categoria }),

      setCategoriaDespesa: (categoria) => set({ categoriaDespesa: categoria }),

      toggleCompararAnoAnterior: () => 
        set((state) => ({ compararComAnoAnterior: !state.compararComAnoAnterior })),

      toggleMostrarProjecao: () => 
        set((state) => ({ mostrarProjecao: !state.mostrarProjecao })),

      setMostrarProjecao: (mostrar) => set({ mostrarProjecao: mostrar }),

      setModoVisualizacao: (modo) => set({ modoVisualizacao: modo }),

      resetFilters: () => set(initialState),
    }),
    {
      name: 'dashboard-filters-storage',
      partialize: (state) => ({
        anoSelecionado: state.anoSelecionado,
        compararComAnoAnterior: state.compararComAnoAnterior,
        mostrarProjecao: state.mostrarProjecao,
        modoVisualizacao: state.modoVisualizacao,
      }),
    }
  )
);

// Hooks auxiliares
export function useAnosDisponiveis() {
  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let ano = 2016; ano <= anoAtual + 1; ano++) {
    anos.push(ano);
  }
  return anos;
}

export function useFiltrosAtivos() {
  const filters = useDashboardFilters();
  
  return {
    ano: filters.periodoPersonalizado ? undefined : filters.anoSelecionado,
    anoInicio: filters.periodoPersonalizado ? filters.anoInicio : undefined,
    anoFim: filters.periodoPersonalizado ? filters.anoFim : undefined,
    tipoReceita: filters.tipoReceita === 'TODOS' ? undefined : filters.tipoReceita,
    tipoDespesa: filters.tipoDespesa === 'TODOS' ? undefined : filters.tipoDespesa,
    comparar: filters.compararComAnoAnterior,
    projecao: filters.mostrarProjecao,
  };
}