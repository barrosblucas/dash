'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart3 } from 'lucide-react';

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
  if (value === null) return { text: '—', className: 'text-dark-400' };
  const prefix = value > 0 ? '+' : '';
  return {
    text: `${prefix}${value.toFixed(1)}%`,
    className: value > 0 ? 'text-revenue-accent' : value < 0 ? 'text-expense-accent' : 'text-dark-400',
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

  const anuais = kpisResponse?.kpis_anuais ?? [];
  const tableRows = useMemo(() => buildTableRows(anuais), [anuais]);

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
        detail: `Ano ${superavitRow.ano}`, icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-revenue-accent', bgColor: 'bg-revenue-accent/10' },
      { label: 'Maior Déficit', value: formatCurrency(deficitRow.saldo, { compact: true }),
        detail: `Ano ${deficitRow.ano}`, icon: <TrendingDown className="w-5 h-5" />,
        color: 'text-expense-accent', bgColor: 'bg-expense-accent/10' },
      { label: 'Maior Crescimento',
        value: crescRow.variacaoReceita !== null
          ? `${crescRow.variacaoReceita > 0 ? '+' : ''}${crescRow.variacaoReceita.toFixed(1)}%`
          : '—',
        detail: `Ano ${crescRow.ano}`, icon: <ArrowUpRight className="w-5 h-5" />,
        color: 'text-forecast-accent', bgColor: 'bg-forecast-accent/10' },
      { label: 'Média Anual Receitas', value: formatCurrency(mediaReceitas, { compact: true }),
        detail: `${tableRows.length} anos`, icon: <BarChart3 className="w-5 h-5" />,
        color: 'text-accent-DEFAULT', bgColor: 'bg-accent-DEFAULT/10' },
    ];
  }, [tableRows]);

  const selectClasses = 'bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-dark-200 focus:border-forecast-DEFAULT focus:outline-none';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com seletores de período */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Comparativo Anual</h1>
            <p className="text-sm text-dark-400 mt-1">Análise comparativa entre períodos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="ano-inicio" className="text-xs text-dark-400">De</label>
              <select id="ano-inicio" value={periodoInicio}
                onChange={(e) => setPeriodoPersonalizado(Number(e.target.value), periodoFim)}
                className={selectClasses}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano} disabled={ano > periodoFim}>{ano}</option>
                ))}
              </select>
            </div>
            <span className="text-dark-500">—</span>
            <div className="flex items-center gap-2">
              <label htmlFor="ano-fim" className="text-xs text-dark-400">Até</label>
              <select id="ano-fim" value={periodoFim}
                onChange={(e) => setPeriodoPersonalizado(periodoInicio, Number(e.target.value))}
                className={selectClasses}>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano} disabled={ano < periodoInicio}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gráfico principal */}
        {isLoading ? (
          <div className="chart-container">
            <LoadingSpinner size="lg" message="Carregando comparativo..." />
          </div>
        ) : error ? (
          <div className="chart-container">
            <p className="text-sm text-red-400">Erro ao carregar dados comparativos.</p>
          </div>
        ) : (
          <ComparativeSection height={500} />
        )}

        {/* Tabela ano a ano */}
        {!isLoading && tableRows.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-dark-100">Análise Ano a Ano</h2>
              <p className="text-xs text-dark-400 mt-0.5">
                Valores totais e variações percentuais
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400">
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
                      <tr key={row.ano} className="border-b border-dark-800 hover:bg-dark-800/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-dark-200">{row.ano}</td>
                        <td className="px-5 py-3 text-right text-dark-200">
                          {formatCurrency(row.receitas, { compact: true })}
                        </td>
                        <td className="px-5 py-3 text-right text-dark-200">
                          {formatCurrency(row.despesas, { compact: true })}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${
                          row.saldo >= 0 ? 'text-revenue-accent' : 'text-expense-accent'}`}>
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
          </div>
        )}

        {/* Cards de resumo */}
        {!isLoading && summaryStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="glass-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-dark-400">{stat.label}</p>
                  <span className={`${stat.bgColor} ${stat.color} p-1.5 rounded-md`}>
                    {stat.icon}
                  </span>
                </div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-dark-500 mt-1">{stat.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
