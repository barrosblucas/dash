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
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';

type ProjectionMode = 'annual' | 'monthly';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface ChartRow {
  label: string;
  receitas: number | null;
  despesas: number | null;
  receitasPrevistas: number | null;
  despesasPrevistas: number | null;
  tipo: 'histórico' | 'projeção';
}

interface KPIAnual {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

interface KPIMensal {
  mes: number;
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
  kpis_mensais: KPIMensal[] | null;
  kpis_anuais: KPIAnual[] | null;
}

interface ForecastPoint {
  data: string;
  valor_previsto: number;
}

interface ForecastResponse {
  tipo: string;
  horizonte_meses: number;
  nivel_confianca: number;
  previsoes: ForecastPoint[];
}

async function fetchYearlyKPIs(anoInicio?: number, anoFim?: number): Promise<KPIsResponse> {
  const params = new URLSearchParams();
  if (anoInicio) params.append('ano_inicio', anoInicio.toString());
  if (anoFim) params.append('ano_fim', anoFim.toString());
  
  const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?${params.toString()}`);
  return response;
}

async function fetchMonthlyKPIs(ano: number): Promise<KPIsResponse> {
  return apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
}

async function fetchForecast(tipo: 'receitas' | 'despesas', horizonte: number): Promise<ForecastResponse> {
  return apiClient.get<ForecastResponse>(`/api/v1/forecast/${tipo}?horizonte=${horizonte}&confianca=0.95`);
}

interface ForecastSectionProps {
  height?: number;
  yearsToProject?: number;
  projectionMode?: ProjectionMode;
  className?: string;
}

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
  const shouldFetchMonthly = projectionMode === 'monthly' || anoSelecionado === currentYear;
  const forecastHorizonMonths = Math.max(24, (yearsToProject + 1) * 12);

  // Buscar KPIs anuais históricos até o ano selecionado
  const { data: kpisAnuaisResponse, isLoading: isLoadingYearly, error: yearlyError } = useQuery({
    queryKey: ['kpis', 'anual', 'forecast', anoSelecionado],
    queryFn: () => fetchYearlyKPIs(2016, anoSelecionado),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: kpisMensaisResponse, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['kpis', 'mensal', 'forecast', anoSelecionado],
    queryFn: () => fetchMonthlyKPIs(anoSelecionado),
    enabled: shouldFetchMonthly,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: forecastReceitas, isLoading: isLoadingForecastReceitas, error: forecastReceitasError } = useQuery({
    queryKey: ['forecast', 'receitas', anoSelecionado, forecastHorizonMonths],
    queryFn: () => fetchForecast('receitas', forecastHorizonMonths),
    enabled: mostrarProjecao,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: forecastDespesas, isLoading: isLoadingForecastDespesas, error: forecastDespesasError } = useQuery({
    queryKey: ['forecast', 'despesas', anoSelecionado, forecastHorizonMonths],
    queryFn: () => fetchForecast('despesas', forecastHorizonMonths),
    enabled: mostrarProjecao,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isLoading =
    isLoadingYearly ||
    (shouldFetchMonthly && isLoadingMonthly) ||
    (mostrarProjecao && (isLoadingForecastReceitas || isLoadingForecastDespesas));

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

  const forecastReceitasByMonth = new Map<string, number>();
  const forecastDespesasByMonth = new Map<string, number>();
  const forecastReceitasByYear = new Map<number, number>();
  const forecastDespesasByYear = new Map<number, number>();

  for (const point of forecastReceitas?.previsoes ?? []) {
    const [yearToken, monthToken] = point.data.split('-');
    const year = Number(yearToken);
    const month = Number(monthToken);
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue;
    const key = `${year}-${month}`;
    const value = Number(point.valor_previsto);
    forecastReceitasByMonth.set(key, value);
    forecastReceitasByYear.set(year, (forecastReceitasByYear.get(year) ?? 0) + value);
  }

  for (const point of forecastDespesas?.previsoes ?? []) {
    const [yearToken, monthToken] = point.data.split('-');
    const year = Number(yearToken);
    const month = Number(monthToken);
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue;
    const key = `${year}-${month}`;
    const value = Number(point.valor_previsto);
    forecastDespesasByMonth.set(key, value);
    forecastDespesasByYear.set(year, (forecastDespesasByYear.get(year) ?? 0) + value);
  }

  const monthlyActualByMonth = new Map<number, { receitas: number; despesas: number }>();
  for (const item of kpisMensaisResponse?.kpis_mensais ?? []) {
    monthlyActualByMonth.set(item.mes, {
      receitas: Number(item.total_receitas),
      despesas: Number(item.total_despesas),
    });
  }

  let chartData: ChartRow[] = [];
  let chartSubtitle = '';
  let projectionTag = '';
  let projectionMarker: string | null = null;

  if (projectionMode === 'monthly') {
    chartData = MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      const key = `${anoSelecionado}-${month}`;
      const actual = monthlyActualByMonth.get(month);
      const canUseActual = anoSelecionado !== currentYear || month < currentMonth;
      const canProjectMonth =
        mostrarProjecao &&
        anoSelecionado === currentYear &&
        month > currentMonth;

      return {
        label,
        receitas: canUseActual ? (actual?.receitas ?? null) : null,
        despesas: canUseActual ? (actual?.despesas ?? null) : null,
        receitasPrevistas: canProjectMonth
          ? (forecastReceitasByMonth.get(key) ?? null)
          : null,
        despesasPrevistas: canProjectMonth
          ? (forecastDespesasByMonth.get(key) ?? null)
          : null,
        tipo: canProjectMonth ? 'projeção' : 'histórico',
      };
    });

    chartSubtitle =
      anoSelecionado === currentYear
        ? `Ano ${anoSelecionado}: histórico fechado + projeção dos meses seguintes`
        : `Ano ${anoSelecionado}: histórico mensal consolidado`;
    projectionTag = 'Projeção mensal';

    if (mostrarProjecao && anoSelecionado === currentYear && currentMonth < 12) {
      projectionMarker = MONTH_LABELS[currentMonth];
    }
  } else {
    const annualHistory = (kpisAnuaisResponse?.kpis_anuais ?? [])
      .filter((kpi) => kpi.ano <= anoSelecionado)
      .map((kpi) => ({
        ano: kpi.ano,
        receitas: Number(kpi.total_receitas),
        despesas: Number(kpi.total_despesas),
      }));

    if (!annualHistory.length) {
      return (
        <div className={`chart-container ${className}`}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
            <p className="text-sm text-dark-400">Sem dados suficientes para projeção anual.</p>
          </div>
        </div>
      );
    }

    let projectedCurrentYearReceitas: number | null = null;
    let projectedCurrentYearDespesas: number | null = null;

    if (mostrarProjecao && anoSelecionado === currentYear) {
      let receitasTotal = 0;
      let despesasTotal = 0;

      for (let month = 1; month <= 12; month++) {
        const key = `${anoSelecionado}-${month}`;
        const actual = monthlyActualByMonth.get(month);

        if (month < currentMonth) {
          receitasTotal += actual?.receitas ?? 0;
          despesasTotal += actual?.despesas ?? 0;
        } else {
          receitasTotal += forecastReceitasByMonth.get(key) ?? (actual?.receitas ?? 0);
          despesasTotal += forecastDespesasByMonth.get(key) ?? (actual?.despesas ?? 0);
        }
      }

      projectedCurrentYearReceitas = receitasTotal;
      projectedCurrentYearDespesas = despesasTotal;
    }

    chartData = annualHistory.map((item) => {
      const isProjectedCurrentYear =
        mostrarProjecao &&
        anoSelecionado === currentYear &&
        item.ano === currentYear;

      return {
        label: item.ano.toString(),
        receitas: isProjectedCurrentYear ? null : item.receitas,
        despesas: isProjectedCurrentYear ? null : item.despesas,
        receitasPrevistas: isProjectedCurrentYear ? projectedCurrentYearReceitas : null,
        despesasPrevistas: isProjectedCurrentYear ? projectedCurrentYearDespesas : null,
        tipo: isProjectedCurrentYear ? 'projeção' : 'histórico',
      };
    });

    const lastYear = annualHistory[annualHistory.length - 1].ano;

    if (mostrarProjecao) {
      const projectedYears = Array.from({ length: yearsToProject }, (_, index) => lastYear + index + 1);

      chartData.push(
        ...projectedYears.map((year) => ({
          label: `${year}*`,
          receitas: null,
          despesas: null,
          receitasPrevistas: forecastReceitasByYear.get(year) ?? null,
          despesasPrevistas: forecastDespesasByYear.get(year) ?? null,
          tipo: 'projeção' as const,
        })),
      );

      projectionMarker = `${lastYear + 1}*`;
    }

    chartSubtitle =
      anoSelecionado === currentYear
        ? `Ano ${anoSelecionado}: anual projetado com meses remanescentes`
        : `Projeção anual para ${yearsToProject} ano(s)`;
    projectionTag = 'Projeção anual';
  }

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

  const firstProjectedPoint = chartData.find((item) => item.receitasPrevistas !== null);
  const lastHistoricalPoint = [...chartData].reverse().find((item) => item.receitas !== null);
  const nextProjectedRevenue = firstProjectedPoint?.receitasPrevistas ?? lastHistoricalPoint?.receitas ?? 0;
  const projectedRevenueValue = firstProjectedPoint?.receitasPrevistas;
  const historicalRevenueValue = lastHistoricalPoint?.receitas;
  const hasComparableGrowth =
    projectedRevenueValue !== null &&
    projectedRevenueValue !== undefined &&
    historicalRevenueValue !== null &&
    historicalRevenueValue !== undefined &&
    historicalRevenueValue > 0;
  const receitaGrowth =
    hasComparableGrowth
      ? ((projectedRevenueValue - historicalRevenueValue) / historicalRevenueValue) * 100
    : 0;

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

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
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