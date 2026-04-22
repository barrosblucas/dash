'use client';

import { useQuery } from '@tanstack/react-query';

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

export default function KPISection() {
  const { anoSelecionado } = useDashboardFilters();

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

  // Skeleton loading
  if (isLoading) {
    return (
      <section>
        <div className="mb-5">
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Carregando indicadores financeiros...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-high mb-4" />
              <div className="h-3 bg-surface-container-high rounded w-24 mb-2" />
              <div className="h-8 bg-surface-container-high rounded w-32 mb-3" />
              <div className="h-3 bg-surface-container-high rounded w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="mb-5">
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-error mt-1">Erro ao carregar indicadores. Tentando novamente...</p>
        </div>
      </section>
    );
  }

  // Calcular valores
  const receitasTotal = Number(kpisResponse?.receitas_total || 0);
  const despesasTotal = Number(kpisResponse?.despesas_total || 0);
  const saldo = Number(kpisResponse?.saldo || 0);

  const receitasAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.total_receitas || 0);
  const despesasAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.total_despesas || 0);
  const saldoAnterior = Number(kpisAnterior?.kpis_anuais?.[0]?.saldo || 0);

  const variacaoReceitas = receitasAnterior > 0
    ? ((receitasTotal - receitasAnterior) / receitasAnterior) * 100
    : 0;

  const variacaoDespesas = despesasAnterior > 0
    ? ((despesasTotal - despesasAnterior) / despesasAnterior) * 100
    : 0;

  const variacaoSaldo = saldoAnterior !== 0
    ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100
    : 0;

  const taxaExecucao = kpisResponse?.percentual_execucao_despesa
    ? Number(kpisResponse.percentual_execucao_despesa)
    : receitasTotal > 0
      ? (despesasTotal / receitasTotal) * 100
      : 0;

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

  return (
    <section>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-headline-sm font-display font-bold text-on-surface">Visão Geral</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Indicadores financeiros — {kpisResponse?.periodo || anoSelecionado}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            data={kpi}
            size="md"
            showTrend={true}
          />
        ))}
      </div>
    </section>
  );
}
