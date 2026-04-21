'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';
import { ForecastSectionProps } from '@/types/forecast';

import {
  fetchYearlyKPIs,
  fetchMonthlyKPIs,
  fetchForecast,
  buildChartData,
  calculateGrowthMetrics,
} from './forecast-helpers';

export default function ForecastSection({
  height = 300,
  yearsToProject = 2,
  projectionMode = 'annual',
  className = '',
}: ForecastSectionProps) {
  const { anoSelecionado, mostrarProjecao } = useDashboardFilters();
  const chartColors = useChartThemeColors();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const remainingMonthsInCurrentYear = 12 - currentMonth + 1;
  const monthlyKpiYear = projectionMode === 'annual' ? currentYear : anoSelecionado;
  const shouldFetchMonthly =
    projectionMode === 'monthly' || (projectionMode === 'annual' && mostrarProjecao);
  const shouldFetchForecast =
    mostrarProjecao && (projectionMode === 'annual' || anoSelecionado === currentYear);
  const forecastHorizonMonths =
    projectionMode === 'annual'
      ? remainingMonthsInCurrentYear + Math.max(0, yearsToProject - 1) * 12
      : remainingMonthsInCurrentYear;

  const { data: kpisAnuaisResponse, isLoading: isLoadingYearly, error: yearlyError } = useQuery({
    queryKey: ['kpis', 'anual', 'forecast', currentYear - 1],
    queryFn: () => fetchYearlyKPIs(2016, currentYear - 1),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: kpisMensaisResponse, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['kpis', 'mensal', 'forecast', monthlyKpiYear],
    queryFn: () => fetchMonthlyKPIs(monthlyKpiYear),
    enabled: shouldFetchMonthly,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: forecastReceitas, isLoading: isLoadingForecastReceitas, error: forecastReceitasError } = useQuery({
    queryKey: ['forecast', 'receitas', projectionMode, forecastHorizonMonths],
    queryFn: () => fetchForecast('receitas', forecastHorizonMonths),
    enabled: shouldFetchForecast,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: forecastDespesas, isLoading: isLoadingForecastDespesas, error: forecastDespesasError } = useQuery({
    queryKey: ['forecast', 'despesas', projectionMode, forecastHorizonMonths],
    queryFn: () => fetchForecast('despesas', forecastHorizonMonths),
    enabled: shouldFetchForecast,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isLoading =
    isLoadingYearly ||
    (shouldFetchMonthly && isLoadingMonthly) ||
    (shouldFetchForecast && (isLoadingForecastReceitas || isLoadingForecastDespesas));

  const hasError =
    Boolean(yearlyError) ||
    Boolean(forecastReceitasError) ||
    Boolean(forecastDespesasError) ||
    !kpisAnuaisResponse?.kpis_anuais;

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
          <p className="text-sm text-dark-400">Carregando dados...</p>
        </div>
        <div className="animate-pulse" style={{ height }}>
          <div className="w-full h-full bg-dark-800/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const {
    chartData,
    chartSubtitle,
    projectionTag,
    projectionMarker,
    chartRenderKey,
  } = buildChartData(
    projectionMode,
    anoSelecionado,
    currentYear,
    currentMonth,
    mostrarProjecao,
    yearsToProject,
    kpisAnuaisResponse,
    kpisMensaisResponse,
    forecastReceitas,
    forecastDespesas
  );

  if (chartData.length === 0) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
          <p className="text-sm text-dark-400">{chartSubtitle}</p>
        </div>
      </div>
    );
  }

  const { nextProjectedRevenue, receitaGrowth } = calculateGrowthMetrics(chartData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const yearData = payload[0].payload;
    const isProjection = yearData.tipo === 'projeção';

    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-4 shadow-lg min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-dark-100">{label}</p>
          {isProjection && (
            <span className="text-xs px-2 py-0.5 bg-forecast-500/20 text-forecast-accent rounded-full">
              Projeção
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {!isProjection ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">Receitas:</span>
                <span className="text-sm font-medium text-revenue-accent">
                  {formatCurrency(yearData.receitas)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">Despesas:</span>
                <span className="text-sm font-medium text-expense-DEFAULT">
                  {formatCurrency(yearData.despesas)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">Receitas (estimado):</span>
                <span className="text-sm font-medium text-revenue-accent">
                  {formatCurrency(yearData.receitasPrevistas)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">Despesas (estimado):</span>
                <span className="text-sm font-medium text-expense-DEFAULT">
                  {formatCurrency(yearData.despesasPrevistas)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forecast-accent" />
              {projectionMode === 'monthly' ? 'Previsão Mensal' : 'Previsão Anual'}
            </h3>
            <p className="text-sm text-dark-400">
              {chartSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-400 bg-dark-800/50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{projectionTag}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height} key={chartRenderKey}>
        <ComposedChart
          key={chartRenderKey}
          data={chartData}
          margin={CHART_CONFIG.defaults.margin}
        >
          <defs>
            <linearGradient id="colorReceitasHist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesasHist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.expense.chart.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.expense.chart.primary} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.borderDefault}
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.textMuted, fontSize: 11 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.textMuted, fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, { compact: true, showSymbol: false })}
          />

          <Tooltip content={<CustomTooltip />} />

          {projectionMarker ? (
            <ReferenceLine
              x={projectionMarker}
              stroke={COLORS.border.accent}
              strokeDasharray="5 5"
              label={{ value: 'Projeção', position: 'top', fill: chartColors.textMuted, fontSize: 11 }}
            />
          ) : null}

          {/* Receitas históricas */}
          <Line
            name="Receitas"
            type="monotone"
            dataKey="receitas"
            stroke={COLORS.revenue.chart.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.revenue.chart.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Despesas históricas */}
          <Line
            name="Despesas"
            type="monotone"
            dataKey="despesas"
            stroke={COLORS.expense.chart.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.expense.chart.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Projeção de receitas */}
          <Line
            name="Receitas (prev)"
            type="monotone"
            dataKey="receitasPrevistas"
            stroke={COLORS.revenue.chart.primary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.revenue.chart.primary, strokeWidth: 2, r: 3, strokeDasharray: '' }}
            connectNulls={false}
          />

          {/* Projeção de despesas */}
          <Line
            name="Despesas (prev)"
            type="monotone"
            dataKey="despesasPrevistas"
            stroke={COLORS.expense.chart.primary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.expense.chart.primary, strokeWidth: 2, r: 3, strokeDasharray: '' }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="glass-card p-3">
          <p className="text-xs text-dark-400 mb-1">
            Crescimento Estimado
          </p>
          <p className={`text-lg font-bold ${receitaGrowth >= 0 ? 'text-revenue-accent' : 'text-expense-accent'}`}>
            {receitaGrowth >= 0 ? '+' : ''}{receitaGrowth.toFixed(1)}%
          </p>
        </div>
        <div className="glass-card p-3">
          <p className="text-xs text-dark-400 mb-1">
            {projectionMode === 'monthly' ? 'Próximo Mês (est.)' : 'Próximo Ano (est.)'}
          </p>
          <p className="text-lg font-bold text-forecast-accent">
            {formatCurrency(nextProjectedRevenue, { compact: true })}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-dark-500 text-center">
        {projectionMode === 'monthly'
          ? '* Meses futuros são projetados com modelo de forecast a partir do histórico municipal consolidado.'
          : '* Projeção anual combina histórico consolidado e agregação das previsões mensais dos períodos seguintes.'}
      </p>
    </div>
  );
}
