'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import Icon from '@/components/ui/Icon';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ComparativeSection from '@/components/dashboard/ComparativeSection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { PERIODO_DADOS } from '@/lib/constants';
import apiClient from '@/services/api';
import { formatCurrency, calcVariation } from '@/lib/utils';


// --- Tipos ---

interface KPIAnual {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  receitas_correntes: number | null;
  receitas_capital: number | null;
  despesas_correntes: number | null;
  despesas_capital: number | null;
}

interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: Array<{
    mes: number; ano: number; total_receitas: number;
    total_despesas: number; saldo: number;
  }> | null;
  kpis_anuais: KPIAnual[] | null;
}

interface TableRow {
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
  variacaoReceita: number | null;
  variacaoDespesa: number | null;
}

// --- Helpers ---

async function fetchYearlyKPIs(anoInicio?: number, anoFim?: number): Promise<KPIsResponse> {
  const params = new URLSearchParams();
  if (anoInicio) params.append('ano_inicio', anoInicio.toString());
  if (anoFim) params.append('ano_fim', anoFim.toString());
  return apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?${params.toString()}`);
}

function buildTableRows(anuais: KPIAnual[]): TableRow[] {
  return anuais.map((kpi, idx) => {
    const prev = idx > 0 ? anuais[idx - 1] : null;
    const receitas = Number(kpi.total_receitas);
    const despesas = Number(kpi.total_despesas);
    return {
      ano: kpi.ano, receitas, despesas,
      saldo: Number(kpi.saldo),
      variacaoReceita: prev ? calcVariation(receitas, Number(prev.total_receitas)).percent : null,
      variacaoDespesa: prev ? calcVariation(despesas, Number(prev.total_despesas)).percent : null,
    };
  });
}

function formatVariation(value: number | null): { text: string; className: string } {
  if (value === null) return { text: '—', className: 'text-on-surface-variant' };
  const prefix = value > 0 ? '+' : '';
  return {
    text: `${prefix}${value.toFixed(1)}%`,
    className: value > 0 ? 'text-secondary' : value < 0 ? 'text-error' : 'text-on-surface-variant',
  };
}

// --- Componente ---

export default function ComparativoClient() {
  const {
    periodoPersonalizado, anoInicio, anoFim, setPeriodoPersonalizado, anoSelecionado,
  } = useDashboardFilters();
  const anosDisponiveis = useAnosDisponiveis();

  const periodoInicio = periodoPersonalizado && anoInicio ? anoInicio : PERIODO_DADOS.ano_inicio;
  const periodoFim = periodoPersonalizado && anoFim ? anoFim : anoSelecionado;

  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'anual', 'comparativo-page', periodoInicio, periodoFim],
    queryFn: () => fetchYearlyKPIs(periodoInicio, periodoFim),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tableRows = useMemo(() => {
    const anuais = kpisResponse?.kpis_anuais ?? [];
    return buildTableRows(anuais);
  }, [kpisResponse?.kpis_anuais]);

  // Estatísticas resumidas
  const summaryStats = useMemo(() => {
    if (tableRows.length === 0) return [];
    const mediaReceitas = tableRows.reduce((s, r) => s + r.receitas, 0) / tableRows.length;
    const superavitRow = tableRows.reduce((b, r) => (r.saldo > b.saldo ? r : b), tableRows[0]);
    const deficitRow = tableRows.reduce((w, r) => (r.saldo < w.saldo ? r : w), tableRows[0]);
    const crescRow = tableRows.reduce((b, r) => {
      if (r.variacaoReceita === null) return b;
      return r.variacaoReceita > (b.variacaoReceita ?? -Infinity) ? r : b;
    }, tableRows[0]);

    return [
      { label: 'Maior Superávit', value: formatCurrency(superavitRow.saldo, { compact: true }),
        detail: `Ano ${superavitRow.ano}`, iconName: 'trending_up',
        color: 'text-secondary', bgColor: 'bg-secondary/10' },
      { label: 'Maior Déficit', value: formatCurrency(deficitRow.saldo, { compact: true }),
        detail: `Ano ${deficitRow.ano}`, iconName: 'trending_down',
        color: 'text-error', bgColor: 'bg-error/10' },
      { label: 'Maior Crescimento',
        value: crescRow.variacaoReceita !== null
          ? `${crescRow.variacaoReceita > 0 ? '+' : ''}${crescRow.variacaoReceita.toFixed(1)}%`
          : '—',
        detail: `Ano ${crescRow.ano}`, iconName: 'arrow_outward',
        color: 'text-tertiary', bgColor: 'bg-tertiary/10' },
      { label: 'Média Anual Receitas', value: formatCurrency(mediaReceitas, { compact: true }),
        detail: `${tableRows.length} anos`, iconName: 'bar_chart',
        color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [tableRows]);

  const selectClasses = 'select-field w-auto';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Cabeçalho monumental com seletores de período */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-display-sm font-display text-on-surface">Comparativo Anual</h1>
            <p className="text-body-md text-on-surface-variant mt-2">Análise comparativa entre períodos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="ano-inicio" className="text-label-md text-on-surface-variant">De</label>
              <select id="ano-inicio" value={periodoInicio}
                onChange={(e) => setPeriodoPersonalizado(Number(e.target.value), periodoFim)}
                className={selectClasses}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano} disabled={ano > periodoFim}>{ano}</option>
                ))}
              </select>
            </div>
            <span className="text-on-surface-variant">—</span>
            <div className="flex items-center gap-2">
              <label htmlFor="ano-fim" className="text-label-md text-on-surface-variant">Até</label>
              <select id="ano-fim" value={periodoFim}
                onChange={(e) => setPeriodoPersonalizado(periodoInicio, Number(e.target.value))}
                className={selectClasses}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano} disabled={ano < periodoInicio}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Gráfico principal */}
        {isLoading ? (
          <div className="chart-container">
            <LoadingSpinner size="lg" message="Carregando comparativo..." />
          </div>
        ) : error ? (
          <div className="chart-container">
            <p className="text-sm text-error">Erro ao carregar dados comparativos.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ComparativeSection height={500} />
          </motion.div>
        )}

        {/* Tabela ano a ano */}
        {!isLoading && tableRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-5 py-4">
              <h2 className="text-headline-sm font-display text-on-surface">Análise Ano a Ano</h2>
              <p className="text-label-md text-on-surface-variant mt-1">
                Valores totais e variações percentuais
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="text-on-surface-variant">
                    {['Ano', 'Receitas', 'Despesas', 'Saldo', 'Var. Receita', 'Var. Despesa'].map(
                      (h, i) => (
                        <th key={h} className={`${i === 0 ? 'text-left' : 'text-right'} px-5 py-3 font-medium`}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const vr = formatVariation(row.variacaoReceita);
                    const vd = formatVariation(row.variacaoDespesa);
                    return (
                      <tr key={row.ano} className="hover:bg-surface-container transition-colors">
                        <td className="px-5 py-3 font-medium text-on-surface">{row.ano}</td>
                        <td className="px-5 py-3 text-right text-on-surface">
                          {formatCurrency(row.receitas, { compact: true })}
                        </td>
                        <td className="px-5 py-3 text-right text-on-surface">
                          {formatCurrency(row.despesas, { compact: true })}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${
                          row.saldo >= 0 ? 'text-secondary' : 'text-error'}`}>
                          {formatCurrency(row.saldo, { compact: true })}
                        </td>
                        <td className={`px-5 py-3 text-right ${vr.className}`}>{vr.text}</td>
                        <td className={`px-5 py-3 text-right ${vd.className}`}>{vd.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Cards de resumo */}
        {!isLoading && summaryStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {summaryStats.map((stat) => (
              <div key={stat.label} className="metric-card hover:shadow-ambient transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <p className="metric-label">{stat.label}</p>
                  <span className={`${stat.bgColor} ${stat.color} p-1.5 rounded-md`}>
                    <Icon name={stat.iconName} size={20} />
                  </span>
                </div>
                <p className={`metric-value ${stat.color}`}>{stat.value}</p>
                <p className="text-label-md text-on-surface-variant/60 mt-1">{stat.detail}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
