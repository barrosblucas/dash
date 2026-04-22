'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { QUERY_KEYS } from '@/lib/constants';
import type { KPICardData } from '@/types';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';

import KPICard from './KPICard';

// Tipos de resposta da API
interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: Array<{
    mes: number;
    ano: number;
    total_receitas: number;
    total_despesas: number;
    saldo: number;
  }> | null;
  kpis_anuais: Array<{
    ano: number;
    total_receitas: number;
    total_despesas: number;
    saldo: number;
  }> | null;
}

/* ────────────────────────────────────────────
   Animações
   ──────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function KPISection() {
  const { anoSelecionado } = useDashboardFilters();

  // Buscar KPIs do ano selecionado
  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEYS.dashboard.all, 'summary', anoSelecionado],
    queryFn: async () => {
      const response = await apiClient.get<KPIsResponse>('/api/v1/kpis', {
        params: { ano: anoSelecionado },
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Buscar dados do ano anterior para comparação
  const anoAnterior = anoSelecionado - 1;

  const { data: kpisAnterior } = useQuery({
    queryKey: [...QUERY_KEYS.dashboard.all, 'comparativo-kpi', anoAnterior],
    queryFn: async () => {
      const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/anual`, {
        params: { ano_inicio: anoAnterior, ano_fim: anoAnterior },
      });
      return response;
    },
    enabled: !!kpisResponse,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section>
        <div className="mb-6">
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Carregando indicadores financeiros...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="h-4 bg-surface-container-high rounded w-24 mb-4"></div>
              <div className="h-10 bg-surface-container-high rounded w-32 mb-2"></div>
              <div className="h-3 bg-surface-container-high rounded w-16"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="mb-6">
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-error mt-1">Erro ao carregar indicadores. Tentando novamente...</p>
        </div>
      </section>
    );
  }

  // Calcular variações
  const receitasTotal = Number(kpisResponse?.receitas_total || 0);
  const despesasTotal = Number(kpisResponse?.despesas_total || 0);
  const saldo = Number(kpisResponse?.saldo || 0);

  const receitasAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.total_receitas || 0);
  const despesasAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.total_despesas || 0);
  const saldoAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.saldo || 0);

  // Calcular variações percentuais
  const variacaoReceitas = receitasAnterior > 0 
    ? ((receitasTotal - receitasAnterior) / receitasAnterior) * 100 
    : 0;
  
  const variacaoDespesas = despesasAnterior > 0 
    ? ((despesasTotal - despesasAnterior) / despesasAnterior) * 100 
    : 0;

  const variacaoSaldo = saldoAnterior !== 0 
    ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100 
    : 0;

  // Taxa de execução (percentual de despesas pagas em relação às receitas)
  const taxaExecucao = kpisResponse?.percentual_execucao_despesa 
    ? Number(kpisResponse.percentual_execucao_despesa) 
    : receitasTotal > 0 
      ? (despesasTotal / receitasTotal) * 100 
      : 0;

  // Montar KPIs
  const kpis: KPICardData[] = [
    {
      titulo: 'Receitas Totais',
      valor: receitasTotal,
      tipo: 'currency',
      variacao: variacaoReceitas,
      variacao_tipo: variacaoReceitas >= 0 ? 'positiva' : 'negativa',
      periodo_comparacao: `${anoAnterior}`,
      tendencia: variacaoReceitas > 5 ? 'alta' : variacaoReceitas < -5 ? 'baixa' : 'estavel',
    },
    {
      titulo: 'Despesas Totais',
      valor: despesasTotal,
      tipo: 'currency',
      variacao: variacaoDespesas,
      variacao_tipo: variacaoDespesas >= 0 ? 'negativa' : 'positiva',
      periodo_comparacao: `${anoAnterior}`,
      tendencia: variacaoDespesas > 5 ? 'alta' : variacaoDespesas < -5 ? 'baixa' : 'estavel',
    },
    {
      titulo: saldo >= 0 ? 'Superávit' : 'Déficit',
      valor: Math.abs(saldo),
      tipo: 'currency',
      variacao: variacaoSaldo,
      variacao_tipo: variacaoSaldo >= 0 ? 'positiva' : 'negativa',
      periodo_comparacao: `${anoAnterior}`,
      tendencia: variacaoSaldo > 5 ? 'alta' : variacaoSaldo < -5 ? 'baixa' : 'estavel',
    },
    {
      titulo: 'Taxa de Execução',
      valor: taxaExecucao,
      tipo: 'percent',
      variacao: taxaExecucao > 90 ? -2.3 : taxaExecucao < 70 ? 5.2 : 0,
      variacao_tipo: taxaExecucao > 90 ? 'positiva' : taxaExecucao < 70 ? 'negativa' : 'neutra',
      periodo_comparacao: `${anoAnterior}`,
      tendencia: taxaExecucao > 90 ? 'estavel' : taxaExecucao < 70 ? 'baixa' : 'estavel',
    },
  ];

  // Ano de referência
  const anoReferencia = kpisResponse?.periodo || String(anoSelecionado);

  return (
    <section>
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Indicadores financeiros principais — {anoReferencia}</p>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {kpis.map((kpi, index) => (
          <motion.div key={index} variants={itemVariants}>
            <KPICard
              data={kpi}
              size="md"
              showTrend={true}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
