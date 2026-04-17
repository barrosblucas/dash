'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Info, BookOpen } from 'lucide-react';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ForecastSection from '@/components/dashboard/ForecastSection';
import { useDashboardFilters } from '@/stores/filtersStore';
import { COLORS } from '@/lib/constants';
import apiClient from '@/services/api';
import { formatCurrency } from '@/lib/utils';


interface KPIAnual {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  kpis_anuais: KPIAnual[] | null;
}

interface TrendMetrics {
  avgGrowth: number;
  projectedReceita: number;
  projectedDespesa: number;
  projectedSaldo: number;
}

type ProjectionMode = 'annual' | 'monthly';

// Projeção linear para o próximo valor (mesma lógica do ForecastSection)
function projectNextValue(data: number[]): number {
  if (data.length < 2) return data[0] || 0;
  const rates: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] > 0) rates.push((data[i] - data[i - 1]) / data[i - 1]);
  }
  if (rates.length === 0) return data[data.length - 1];
  const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
  return data[data.length - 1] * (1 + Math.max(-0.5, Math.min(0.5, avg)));
}

function computeTrendMetrics(anuais: KPIAnual[]): TrendMetrics | null {
  if (anuais.length < 2) return null;
  const receitas = anuais.map((k) => Number(k.total_receitas));
  const despesas = anuais.map((k) => Number(k.total_despesas));
  const rates: number[] = [];
  for (let i = 1; i < receitas.length; i++) {
    if (receitas[i - 1] > 0) rates.push(((receitas[i] - receitas[i - 1]) / receitas[i - 1]) * 100);
  }
  const avgGrowth = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
  const projectedReceita = projectNextValue(receitas);
  const projectedDespesa = projectNextValue(despesas);
  return { avgGrowth, projectedReceita, projectedDespesa, projectedSaldo: projectedReceita - projectedDespesa };
}

const YEARS_OPTIONS = [1, 2, 3, 4, 5] as const;

export default function ForecastClient() {
  const { anoSelecionado, mostrarProjecao, toggleMostrarProjecao, setAnoSelecionado } = useDashboardFilters();
  const [yearsToProject, setYearsToProject] = useState(2);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('annual');
  const currentYear = new Date().getFullYear();
  const trendEndYear = Math.min(anoSelecionado, currentYear - 1);

  // Projeções ativadas por padrão nesta página
  useEffect(() => {
    if (!mostrarProjecao) toggleMostrarProjecao();
  }, [mostrarProjecao, toggleMostrarProjecao]);

  // KPIs anuais para os cards de tendência
  const { data: kpisResponse, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', 'anual', 'forecast-page', trendEndYear],
    queryFn: () => apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?ano_inicio=2016&ano_fim=${trendEndYear}`),
    enabled: trendEndYear >= 2016,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const trendMetrics = kpisResponse?.kpis_anuais ? computeTrendMetrics(kpisResponse.kpis_anuais) : null;
  const availableYears = Array.from({ length: currentYear - 2016 + 1 }, (_, i) => currentYear - i);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-forecast-accent" />
              Previsões Financeiras
            </h1>
            <p className="text-sm text-dark-400 mt-1">Projeção baseada em dados históricos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="projection-mode" className="text-xs text-dark-400 whitespace-nowrap">Visualização:</label>
              <select
                id="projection-mode"
                value={projectionMode}
                onChange={(e) => setProjectionMode(e.target.value as ProjectionMode)}
                className="bg-dark-800 border border-dark-700 text-dark-100 text-sm rounded-lg px-3 py-1.5 focus:border-forecast-accent focus:outline-none"
              >
                <option value="annual">Anual (ano a ano)</option>
                <option value="monthly">Mensal (meses seguintes)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="base-year" className="text-xs text-dark-400 whitespace-nowrap">Ano base:</label>
              <select
                id="base-year"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className="bg-dark-800 border border-dark-700 text-dark-100 text-sm rounded-lg px-3 py-1.5 focus:border-forecast-accent focus:outline-none"
              >
                {availableYears.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
              </select>
            </div>
            {projectionMode === 'annual' ? (
              <div className="flex items-center gap-2">
                <label htmlFor="years-project" className="text-xs text-dark-400 whitespace-nowrap">Projetar:</label>
                <select
                  id="years-project"
                  value={yearsToProject}
                  onChange={(e) => setYearsToProject(Number(e.target.value))}
                  className="bg-dark-800 border border-dark-700 text-dark-100 text-sm rounded-lg px-3 py-1.5 focus:border-forecast-accent focus:outline-none"
                >
                  {YEARS_OPTIONS.map((n) => <option key={n} value={n}>{n} ano{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Forecast Chart */}
        <Suspense fallback={<LoadingSpinner />}>
          <ForecastSection
            height={500}
            yearsToProject={yearsToProject}
            projectionMode={projectionMode}
          />
        </Suspense>

        {/* Methodology + Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Methodology Card */}
          <div className="glass-card p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-forecast-accent" />
              <h3 className="text-base font-semibold text-dark-100">Metodologia</h3>
            </div>
            <div className="space-y-3 text-sm text-dark-300">
              <p>
                A projeção utiliza{' '}
                <span className="text-forecast-accent font-medium">modelo de forecast com sazonalidade</span>{' '}
                sobre o histórico municipal consolidado de receitas e despesas.
              </p>
              <div className="glass-card p-3 space-y-2">
                <p className="text-xs text-dark-400 font-medium uppercase tracking-wide">Parâmetros</p>
                <ul className="space-y-1 text-xs text-dark-400">
                  <li>&bull; Histórico municipal completo (base anual e mensal)</li>
                  <li>&bull; Ajuste para mês corrente parcial no treino</li>
                  <li>&bull; Agregação anual da projeção mensal para o ano corrente</li>
                </ul>
              </div>
              <div className="flex items-start gap-2 p-3 bg-forecast-500/10 border border-forecast-500/20 rounded-lg">
                <Info className="w-4 h-4 text-forecast-accent mt-0.5 shrink-0" />
                <p className="text-xs text-dark-400">
                  O operador pode alternar entre visão <span className="text-forecast-accent">mensal</span>
                  para os meses seguintes do ano corrente e visão <span className="text-forecast-accent">anual</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Trend Analysis Cards */}
          <div className="lg:col-span-2">
            {kpisLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-4 bg-dark-800/50 rounded w-24 mb-3" />
                    <div className="h-8 bg-dark-800/50 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : trendMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Crescimento Médio Anual */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {trendMetrics.avgGrowth >= 0
                      ? <TrendingUp className="w-4 h-4 text-revenue-accent" />
                      : <TrendingDown className="w-4 h-4 text-expense-accent" />}
                    <span className="text-xs text-dark-400">Crescimento Médio Anual</span>
                  </div>
                  <p className={`text-xl font-bold ${trendMetrics.avgGrowth >= 0 ? 'text-revenue-accent' : 'text-expense-accent'}`}>
                    {trendMetrics.avgGrowth >= 0 ? '+' : ''}{trendMetrics.avgGrowth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Média das variações anuais de receita</p>
                </div>

                {/* Receita Projetada */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-revenue-accent" />
                    <span className="text-xs text-dark-400">Receita Projetada ({anoSelecionado + 1})</span>
                  </div>
                  <p className="text-xl font-bold text-revenue-accent">
                    {formatCurrency(trendMetrics.projectedReceita, { compact: true })}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Estimativa para o próximo exercício</p>
                </div>

                {/* Despesa Projetada */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-expense-DEFAULT" />
                    <span className="text-xs text-dark-400">Despesa Projetada ({anoSelecionado + 1})</span>
                  </div>
                  <p className="text-xl font-bold text-expense-DEFAULT">
                    {formatCurrency(trendMetrics.projectedDespesa, { compact: true })}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Estimativa para o próximo exercício</p>
                </div>

                {/* Saldo Projetado */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign
                      className="w-4 h-4"
                      style={{ color: trendMetrics.projectedSaldo >= 0 ? COLORS.revenue.accent : COLORS.expense.accent }}
                    />
                    <span className="text-xs text-dark-400">Saldo Projetado ({anoSelecionado + 1})</span>
                  </div>
                  <p className={`text-xl font-bold ${trendMetrics.projectedSaldo >= 0 ? 'text-revenue-accent' : 'text-expense-accent'}`}>
                    {formatCurrency(trendMetrics.projectedSaldo, { compact: true })}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Receita projetada - Despesa projetada</p>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-dark-400">Dados históricos insuficientes para calcular tendências.</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-dark-800 pt-4">
          <p className="text-xs text-dark-500 text-center leading-relaxed">
            As projeções apresentadas são estimativas baseadas em dados históricos financeiros do município e não constituem
            garantia de resultados futuros. Fatores econômicos, mudanças na legislação e eventos imprevisíveis podem
            afetar significativamente os valores reais. Utilize como referência para planejamento.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
