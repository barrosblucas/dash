'use client';

import { useQuery } from '@tanstack/react-query';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import apiClient from '@/services/api';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';

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

async function fetchYearlyKPIs(anoInicio?: number, anoFim?: number): Promise<KPIsResponse> {
  const params = new URLSearchParams();
  if (anoInicio) params.append('ano_inicio', anoInicio.toString());
  if (anoFim) params.append('ano_fim', anoFim.toString());
  
  const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?${params.toString()}`);
  return response;
}

// Função simples de projeção linear
function projectTrend(historicalData: number[], yearsToProject: number = 2): number[] {
  if (historicalData.length < 2) return [];
  
  // Calcular taxa de crescimento média anual
  const growthRates: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    if (historicalData[i - 1] > 0) {
      growthRates.push((historicalData[i] - historicalData[i - 1]) / historicalData[i - 1]);
    }
  }
  
  if (growthRates.length === 0) return [];
  
  const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  
  // Projetar próximos anos
  const projections: number[] = [];
  let lastValue = historicalData[historicalData.length - 1];
  
  for (let i = 0; i < yearsToProject; i++) {
    // Limitar crescimento a ±50% para ser mais conservador
    const constrainedGrowth = Math.max(-0.5, Math.min(0.5, avgGrowthRate));
    lastValue = lastValue * (1 + constrainedGrowth);
    projections.push(lastValue);
  }
  
  return projections;
}

interface ForecastSectionProps {
  height?: number;
  yearsToProject?: number;
  className?: string;
}

export default function ForecastSection({
  height = 300,
  yearsToProject = 2,
  className = '',
}: ForecastSectionProps) {
  const { anoSelecionado, mostrarProjecao } = useDashboardFilters();
  const chartColors = useChartThemeColors();

  // Buscar KPIs anuais históricos até o ano selecionado
  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'anual', 'forecast', anoSelecionado],
    queryFn: () => fetchYearlyKPIs(2016, anoSelecionado),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

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

  if (error || !kpisResponse?.kpis_anuais) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // Dados históricos
  const historicalYears = kpisResponse.kpis_anuais.map(k => k.ano);
  const historicalReceitas = kpisResponse.kpis_anuais.map(k => Number(k.total_receitas));
  const historicalDespesas = kpisResponse.kpis_anuais.map(k => Number(k.total_despesas));
  
  // Calcular projeções apenas se habilitado pelo filtro
  const projectedReceitas = mostrarProjecao ? projectTrend(historicalReceitas, yearsToProject) : [];
  const projectedDespesas = mostrarProjecao ? projectTrend(historicalDespesas, yearsToProject) : [];
  
  const lastYear = Math.max(...historicalYears);
  const projectedYears = Array.from({ length: yearsToProject }, (_, i) => lastYear + i + 1);

  // Montar dados do gráfico
  const chartData = [
    // Dados históricos
    ...kpisResponse.kpis_anuais.map((kpi, index) => ({
      ano: kpi.ano,
      receitas: Number(kpi.total_receitas),
      despesas: Number(kpi.total_despesas),
      receitasPrevistas: null,
      despesasPrevistas: null,
      tipo: 'histórico',
      label: kpi.ano.toString(),
    })),
    // Dados projetados
    ...projectedYears.map((ano, index) => ({
      ano,
      receitas: null,
      despesas: null,
      receitasPrevistas: projectedReceitas[index],
      despesasPrevistas: projectedDespesas[index],
      tipo: 'projeção',
      label: `${ano}*`,
    })),
  ];

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

  // Último valor real e primeira projeção para cálculo de tendência
  const lastHistoricalReceita = historicalReceitas[historicalReceitas.length - 1];
  const firstProjectedReceita = projectedReceitas[0];
  const receitaGrowth = lastHistoricalReceita > 0 
    ? ((firstProjectedReceita - lastHistoricalReceita) / lastHistoricalReceita) * 100 
    : 0;

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forecast-accent" />
              Previsão
            </h3>
            <p className="text-sm text-dark-400">
              Projeção para {yearsToProject} ano(s)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-400 bg-dark-800/50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Estimativa simples</span>
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

          <ReferenceLine
            x={`${lastYear + 1}*`}
            stroke={COLORS.border.accent}
            strokeDasharray="5 5"
            label={{ value: 'Previsão', position: 'top', fill: chartColors.textMuted, fontSize: 11 }}
          />

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
            Próximo Ano (est.)
          </p>
          <p className="text-lg font-bold text-forecast-accent">
            {formatCurrency(projectedReceitas[0], { compact: true })}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-dark-500 text-center">
        * Projeção baseada em tendência histórica linear. Implementação com Prophet será disponibilizada em breve.
      </p>
    </div>
  );
}