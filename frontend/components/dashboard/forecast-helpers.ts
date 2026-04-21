import apiClient from '@/services/api';
import {
  KPIsResponse,
  ForecastResponse,
  ChartRow,
  ProjectionMode,
} from '@/types/forecast';

export async function fetchYearlyKPIs(
  anoInicio?: number,
  anoFim?: number
): Promise<KPIsResponse> {
  const params = new URLSearchParams();
  if (anoInicio) params.append('ano_inicio', anoInicio.toString());
  if (anoFim) params.append('ano_fim', anoFim.toString());

  const response = await apiClient.get<KPIsResponse>(
    `/api/v1/kpis/anual?${params.toString()}`
  );
  return response;
}

export async function fetchMonthlyKPIs(ano: number): Promise<KPIsResponse> {
  return apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
}

export async function fetchForecast(
  tipo: 'receitas' | 'despesas',
  horizonte: number
): Promise<ForecastResponse> {
  return apiClient.get<ForecastResponse>(
    `/api/v1/forecast/${tipo}?horizonte=${horizonte}&confianca=0.95`
  );
}

interface ForecastMaps {
  byMonth: Map<string, number>;
  byYear: Map<number, number>;
}

export function buildForecastMaps(
  forecast: ForecastResponse | undefined
): ForecastMaps {
  const byMonth = new Map<string, number>();
  const byYear = new Map<number, number>();

  for (const point of forecast?.previsoes ?? []) {
    const [yearToken, monthToken] = point.data.split('-');
    const year = Number(yearToken);
    const month = Number(monthToken);
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue;
    const key = `${year}-${month}`;
    const value = Number(point.valor_previsto);
    byMonth.set(key, value);
    byYear.set(year, (byYear.get(year) ?? 0) + value);
  }

  return { byMonth, byYear };
}

export function buildMonthlyActualMap(
  response: KPIsResponse | undefined
): Map<number, { receitas: number; despesas: number }> {
  const map = new Map<number, { receitas: number; despesas: number }>();
  for (const item of response?.kpis_mensais ?? []) {
    map.set(item.mes, {
      receitas: Number(item.total_receitas),
      despesas: Number(item.total_despesas),
    });
  }
  return map;
}

interface ChartBuildResult {
  chartData: ChartRow[];
  chartSubtitle: string;
  projectionTag: string;
  projectionMarker: string | null;
  chartRenderKey: string;
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function buildChartData(
  projectionMode: ProjectionMode,
  anoSelecionado: number,
  currentYear: number,
  currentMonth: number,
  mostrarProjecao: boolean,
  yearsToProject: number,
  kpisAnuaisResponse: KPIsResponse | undefined,
  kpisMensaisResponse: KPIsResponse | undefined,
  forecastReceitas: ForecastResponse | undefined,
  forecastDespesas: ForecastResponse | undefined
): ChartBuildResult {
  const forecastReceitasMaps = buildForecastMaps(forecastReceitas);
  const forecastDespesasMaps = buildForecastMaps(forecastDespesas);
  const monthlyActualByMonth = buildMonthlyActualMap(kpisMensaisResponse);

  let chartData: ChartRow[] = [];
  let chartSubtitle = '';
  let projectionTag = '';
  let projectionMarker: string | null = null;
  let chartRenderKey = `${projectionMode}-${anoSelecionado}-${yearsToProject}`;

  if (projectionMode === 'monthly') {
    chartData = MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      const key = `${anoSelecionado}-${month}`;
      const actual = monthlyActualByMonth.get(month);
      const canUseActual = anoSelecionado !== currentYear || month < currentMonth;
      const canProjectMonth =
        mostrarProjecao && anoSelecionado === currentYear && month > currentMonth;

      return {
        label,
        receitas: canUseActual ? (actual?.receitas ?? null) : null,
        despesas: canUseActual ? (actual?.despesas ?? null) : null,
        receitasPrevistas: canProjectMonth
          ? (forecastReceitasMaps.byMonth.get(key) ?? null)
          : null,
        despesasPrevistas: canProjectMonth
          ? (forecastDespesasMaps.byMonth.get(key) ?? null)
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
    const annualHistory = (kpisAnuaisResponse?.kpis_anuais ?? []).map((kpi) => ({
      ano: kpi.ano,
      receitas: Number(kpi.total_receitas),
      despesas: Number(kpi.total_despesas),
    }));

    if (!annualHistory.length) {
      return {
        chartData: [],
        chartSubtitle: 'Sem dados suficientes para projeção anual.',
        projectionTag: '',
        projectionMarker: null,
        chartRenderKey,
      };
    }

    chartData = annualHistory.map((item) => ({
      label: item.ano.toString(),
      receitas: item.receitas,
      despesas: item.despesas,
      receitasPrevistas: null,
      despesasPrevistas: null,
      tipo: 'histórico' as const,
    }));

    if (mostrarProjecao) {
      let projectedCurrentYearReceitas = 0;
      let projectedCurrentYearDespesas = 0;

      for (let month = 1; month <= 12; month++) {
        const key = `${currentYear}-${month}`;
        const actual = monthlyActualByMonth.get(month);

        if (month < currentMonth) {
          projectedCurrentYearReceitas += actual?.receitas ?? 0;
          projectedCurrentYearDespesas += actual?.despesas ?? 0;
          continue;
        }

        projectedCurrentYearReceitas +=
          forecastReceitasMaps.byMonth.get(key) ?? (actual?.receitas ?? 0);
        projectedCurrentYearDespesas +=
          forecastDespesasMaps.byMonth.get(key) ?? (actual?.despesas ?? 0);
      }

      const projectedYears = Array.from(
        { length: yearsToProject },
        (_, index) => currentYear + index
      );

      chartData.push(
        ...projectedYears.map((year) => {
          const isProjectedCurrentYear = year === currentYear;
          const currentYearLabel =
            anoSelecionado === currentYear && isProjectedCurrentYear
              ? currentYear.toString()
              : `${year}*`;

          return {
            label: currentYearLabel,
            receitas: null,
            despesas: null,
            receitasPrevistas: isProjectedCurrentYear
              ? projectedCurrentYearReceitas
              : (forecastReceitasMaps.byYear.get(year) ?? null),
            despesasPrevistas: isProjectedCurrentYear
              ? projectedCurrentYearDespesas
              : (forecastDespesasMaps.byYear.get(year) ?? null),
            tipo: 'projeção' as const,
          };
        })
      );

      projectionMarker = chartData.find((item) => item.tipo === 'projeção')?.label ?? null;
    }

    const projectedEndYear = currentYear + yearsToProject - 1;
    chartSubtitle = `Histórico consolidado até ${currentYear - 1} com projeção anual de ${currentYear} até ${projectedEndYear}`;
    projectionTag = 'Projeção anual';
  }

  chartRenderKey = `${chartRenderKey}-${chartData.length}-${projectionMarker ?? 'no-marker'}`;

  return { chartData, chartSubtitle, projectionTag, projectionMarker, chartRenderKey };
}

interface GrowthMetrics {
  nextProjectedRevenue: number;
  receitaGrowth: number;
}

export function calculateGrowthMetrics(chartData: ChartRow[]): GrowthMetrics {
  const firstProjectedPoint = chartData.find((item) => item.receitasPrevistas !== null);
  const lastHistoricalPoint = [...chartData].reverse().find((item) => item.receitas !== null);
  const nextProjectedRevenue =
    firstProjectedPoint?.receitasPrevistas ?? lastHistoricalPoint?.receitas ?? 0;
  const projectedRevenueValue = firstProjectedPoint?.receitasPrevistas;
  const historicalRevenueValue = lastHistoricalPoint?.receitas;
  const hasComparableGrowth =
    projectedRevenueValue !== null &&
    projectedRevenueValue !== undefined &&
    historicalRevenueValue !== null &&
    historicalRevenueValue !== undefined &&
    historicalRevenueValue > 0;
  const receitaGrowth = hasComparableGrowth
    ? ((projectedRevenueValue - historicalRevenueValue) / historicalRevenueValue) * 100
    : 0;

  return { nextProjectedRevenue, receitaGrowth };
}
