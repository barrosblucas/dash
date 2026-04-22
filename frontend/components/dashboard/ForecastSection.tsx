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
import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
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
  height = 320,
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
        <div className="mb-5">
          <h3 className="text-title-lg font-display font-semibold text-on-surface flex items-center gap-2">
            <Icon name="trending_up" size={22} className="text-tertiary" />
            Previsão
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Carregando dados...</p>
        </div>
        <div className="animate-pulse" style={{ height }}>
          <div className="w-full h-full bg-surface-container-high/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-5">
          <h3 className="text-title-lg font-display font-semibold text-on-surface flex items-center gap-2">
            <Icon name="trending_up" size={22} className="text-tertiary" />
            Previsão
          </h3>
          <p className="text-body-sm text-error mt-1">Erro ao carregar dados</p>
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
        <div className="mb-5">
          <h3 className="text-title-lg font-display font-semibold text-on-surface flex items-center gap-2">
            <Icon name="trending_up" size={22} className="text-tertiary" />
            Previsão
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-1">{chartSubtitle}</p>
        </div>
      </div>
    );
  }

  const { nextProjectedRevenue, receitaGrowth } = calculateGrowthMetrics(chartData);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        tipo: string;
        receitas: number;
        despesas: number;
        receitasPrevistas: number;
        despesasPrevistas: number;
      };
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const yearData = payload[0].payload;
    const isProjection = yearData.tipo === 'projeção';

    return (
      <div className="custom-tooltip bg-surface-container-highest backdrop-blur-xl rounded-xl p-4 shadow-ambient-lg min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-on-surface">{label}</p>
          {isProjection && (
            <span className="chip-tertiary">Projeção</span>
          )}
        </div>

        <div className="space-y-2">
          {!isProjection ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Receitas:</span>
                <span className="text-sm font-semibold text-secondary">
                  {formatCurrency(yearData.receitas)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Despesas:</span>
                <span className="text-sm font-semibold text-error">
                  {formatCurrency(yearData.despesas)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Receitas (estimado):</span>
                <span className="text-sm font-semibold text-secondary">
                  {formatCurrency(yearData.receitasPrevistas)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Despesas (estimado):</span>
                <span className="text-sm font-semibold text-error">
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
    <motion.div
      className={`chart-container ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-title-lg font-display font-semibold text-on-surface flex items-center gap-2">
              <Icon name="trending_up" size={22} className="text-tertiary" />
              {projectionMode === 'monthly' ? 'Previsão Mensal' : 'Previsão Anual'}
            </h3>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {chartSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg self-start">
            <Icon name="info" size={14} />
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
            strokeWidth={2.5}
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
            strokeWidth={2.5}
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

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="surface-card p-4 rounded-xl">
          <p className="text-label-md text-on-surface-variant mb-1">
            Crescimento Estimado
          </p>
          <p className={`text-headline-sm font-display font-bold ${receitaGrowth >= 0 ? 'text-secondary' : 'text-error'}`}>
            {receitaGrowth >= 0 ? '+' : ''}{receitaGrowth.toFixed(1)}%
          </p>
        </div>
        <div className="surface-card p-4 rounded-xl">
          <p className="text-label-md text-on-surface-variant mb-1">
            {projectionMode === 'monthly' ? 'Próximo Mês (est.)' : 'Próximo Ano (est.)'}
          </p>
          <p className="text-headline-sm font-display font-bold text-tertiary">
            {formatCurrency(nextProjectedRevenue, { compact: true })}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-on-surface-variant/60 text-center">
        {projectionMode === 'monthly'
          ? '* Meses futuros são projetados com modelo de forecast a partir do histórico municipal consolidado.'
          : '* Projeção anual combina histórico consolidado e agregação das previsões mensais dos períodos seguintes.'}
      </p>
    </motion.div>
  );
}
