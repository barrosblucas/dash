'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import ForecastSection from '@/components/dashboard/ForecastSection';
import { useDashboardFilters } from '@/stores/filtersStore';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function ForecastClient() {
  const { anoSelecionado, mostrarProjecao, setMostrarProjecao, setAnoSelecionado } = useDashboardFilters();
  const [yearsToProject, setYearsToProject] = useState(2);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('annual');
  const currentYear = new Date().getFullYear();
  const trendEndYear = Math.min(anoSelecionado, currentYear - 1);

  useEffect(() => {
    setMostrarProjecao(true);
  }, [setMostrarProjecao]);

  const { data: kpisResponse, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', 'anual', 'forecast-page', trendEndYear],
    queryFn: () => apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?ano_inicio=2016&ano_fim=${trendEndYear}`),
    enabled: trendEndYear >= 2016,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const trendMetrics = kpisResponse?.kpis_anuais ? computeTrendMetrics(kpisResponse.kpis_anuais) : null;
  const availableYears = Array.from({ length: currentYear - 2016 + 1 }, (_, i) => currentYear - i);
  const forecastViewKey = `${projectionMode}-${anoSelecionado}-${yearsToProject}-${mostrarProjecao}`;

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-tertiary-container/20">
                <Icon name="query_stats" className="text-tertiary" size={22} />
              </div>
              <span className="chip-tertiary">Projeções Financeiras</span>
            </div>
            <h1 className="font-display text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
              Previsões Financeiras
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
              Projeção baseada em dados históricos municipais consolidados de receitas e despesas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Icon name="visibility" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <select
                id="projection-mode"
                value={projectionMode}
                onChange={(e) => setProjectionMode(e.target.value as ProjectionMode)}
                className="select-field pl-9 pr-8"
              >
                <option value="annual">Anual (ano a ano)</option>
                <option value="monthly">Mensal (meses seguintes)</option>
              </select>
            </div>

            <div className="relative">
              <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <select
                id="base-year"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className="select-field pl-9 pr-8"
              >
                {availableYears.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
              </select>
            </div>

            {projectionMode === 'annual' ? (
              <div className="relative">
                <Icon name="date_range" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                <select
                  id="years-project"
                  value={yearsToProject}
                  onChange={(e) => setYearsToProject(Number(e.target.value))}
                  className="select-field pl-9 pr-8"
                >
                  {YEARS_OPTIONS.map((n) => <option key={n} value={n}>{n} ano{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Main Forecast Chart */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<LoadingSpinner />}>
            <ForecastSection
              key={forecastViewKey}
              height={500}
              yearsToProject={yearsToProject}
              projectionMode={projectionMode}
            />
          </Suspense>
        </motion.div>

        {/* Methodology + Trend Analysis */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Methodology Card */}
          <div className="surface-card p-6 lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-tertiary-container/20">
                <Icon name="menu_book" className="text-tertiary" size={20} />
              </div>
              <h3 className="text-title-md font-display text-on-surface">Metodologia</h3>
            </div>
            <div className="space-y-4 text-body-sm text-on-surface-variant">
              <p>
                A projeção utiliza{' '}
                <span className="text-tertiary font-medium">modelo de forecast com sazonalidade</span>{' '}
                sobre o histórico municipal consolidado de receitas e despesas.
              </p>
              <div className="surface-card bg-surface-container-low/60 p-4 space-y-2">
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Parâmetros</p>
                <ul className="space-y-1.5 text-label-md text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-secondary mt-0.5 shrink-0" />
                    <span>Histórico municipal completo (base anual e mensal)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-secondary mt-0.5 shrink-0" />
                    <span>Ajuste para mês corrente parcial no treino</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-secondary mt-0.5 shrink-0" />
                    <span>Agregação anual da projeção mensal para o ano corrente</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-start gap-3 p-4 bg-tertiary-container/10 rounded-xl">
                <Icon name="info" className="text-tertiary mt-0.5 shrink-0" size={18} />
                <p className="text-label-md text-on-surface-variant">
                  O operador pode alternar entre visão <span className="text-tertiary font-medium">mensal</span>
                  {' '}para os meses seguintes do ano corrente e visão <span className="text-tertiary font-medium">anual</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Trend Analysis Cards */}
          <div className="lg:col-span-2">
            {kpisLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="kpi-card animate-pulse">
                    <div className="h-4 bg-surface-container-high rounded w-24 mb-3" />
                    <div className="h-8 bg-surface-container-high rounded w-32" />
                  </div>
                ))}
              </div>
            ) : trendMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TrendCard
                  label="Crescimento Médio Anual"
                  value={`${trendMetrics.avgGrowth >= 0 ? '+' : ''}${trendMetrics.avgGrowth.toFixed(1)}%`}
                  iconName={trendMetrics.avgGrowth >= 0 ? 'trending_up' : 'trending_down'}
                  accentColor={trendMetrics.avgGrowth >= 0 ? 'text-secondary' : 'text-error'}
                  iconBg={trendMetrics.avgGrowth >= 0 ? 'bg-secondary-container/20' : 'bg-error-container/20'}
                  description="Média das variações anuais de receita"
                />
                <TrendCard
                  label={`Receita Projetada (${anoSelecionado + 1})`}
                  value={formatCurrency(trendMetrics.projectedReceita, { compact: true })}
                  iconName="attach_money"
                  accentColor="text-secondary"
                  iconBg="bg-secondary-container/20"
                  description="Estimativa para o próximo exercício"
                />
                <TrendCard
                  label={`Despesa Projetada (${anoSelecionado + 1})`}
                  value={formatCurrency(trendMetrics.projectedDespesa, { compact: true })}
                  iconName="bar_chart"
                  accentColor="text-expense"
                  iconBg="bg-error-container/20"
                  description="Estimativa para o próximo exercício"
                />
                <TrendCard
                  label={`Saldo Projetado (${anoSelecionado + 1})`}
                  value={formatCurrency(trendMetrics.projectedSaldo, { compact: true })}
                  iconName="account_balance"
                  accentColor={trendMetrics.projectedSaldo >= 0 ? 'text-secondary' : 'text-error'}
                  iconBg={trendMetrics.projectedSaldo >= 0 ? 'bg-secondary-container/20' : 'bg-error-container/20'}
                  description="Receita projetada - Despesa projetada"
                />
              </div>
            ) : (
              <div className="surface-card p-8 text-center">
                <Icon name="analytics" className="text-on-surface-variant/30 mx-auto mb-3" size={40} />
                <p className="text-body-md text-on-surface-variant">Dados históricos insuficientes para calcular tendências.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div variants={itemVariants} className="surface-card p-6">
          <div className="flex items-start gap-3">
            <Icon name="warning_amber" className="text-tertiary mt-0.5 shrink-0" size={20} />
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              As projeções apresentadas são estimativas baseadas em dados históricos financeiros do município e não constituem
              garantia de resultados futuros. Fatores econômicos, mudanças na legislação e eventos imprevisíveis podem
              afetar significativamente os valores reais. Utilize como referência para planejamento.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ─── Sub-componentes ───────────────────────────────────────────────── */

interface TrendCardProps {
  label: string;
  value: string;
  iconName: string;
  accentColor: string;
  iconBg: string;
  description: string;
}

function TrendCard({ label, value, iconName, accentColor, iconBg, description }: TrendCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
          <Icon name={iconName} className={accentColor} size={20} />
        </div>
        <span className="kpi-label">{label}</span>
      </div>
      <p className={`kpi-value ${accentColor}`}>{value}</p>
      <p className="text-label-md text-on-surface-variant mt-2">{description}</p>
    </div>
  );
}
