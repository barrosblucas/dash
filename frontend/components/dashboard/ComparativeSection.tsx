'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar, Area } from 'recharts';

import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG, PERIODO_DADOS } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';

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
    mes: number;
    ano: number;
    total_receitas: number;
    total_despesas: number;
    saldo: number;
  }> | null;
  kpis_anuais: KPIAnual[] | null;
}

async function fetchYearlyKPIs(anoInicio?: number, anoFim?: number): Promise<KPIsResponse> {
  const params = new URLSearchParams();
  if (anoInicio) params.append('ano_inicio', anoInicio.toString());
  if (anoFim) params.append('ano_fim', anoFim.toString());
  
  const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/anual?${params.toString()}`);
  return response;
}

interface ComparativeSectionProps {
  height?: number;
  className?: string;
}

export default function ComparativeSection({
  height = 300,
  className = '',
}: ComparativeSectionProps) {
  const { periodoPersonalizado, anoInicio, anoFim, anoSelecionado } = useDashboardFilters();
  const chartColors = useChartThemeColors();

  // Determinar período com base nos filtros do store
  const periodoInicio = periodoPersonalizado && anoInicio ? anoInicio : PERIODO_DADOS.ano_inicio;
  const periodoFim = periodoPersonalizado && anoFim ? anoFim : anoSelecionado;

  // Buscar KPIs anuais
  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'anual', 'comparativo', periodoInicio, periodoFim],
    queryFn: () => fetchYearlyKPIs(periodoInicio, periodoFim),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Comparativo</h3>
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
          <h3 className="text-lg font-semibold text-dark-100">Comparativo</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = kpisResponse.kpis_anuais.map((kpi) => ({
    ano: kpi.ano,
    receitas: Number(kpi.total_receitas),
    despesas: Number(kpi.total_despesas),
    saldo: Number(kpi.saldo),
    receitasFormatado: formatCurrency(kpi.total_receitas, { compact: true, showSymbol: false }),
    despesasFormatado: formatCurrency(kpi.total_despesas, { compact: true, showSymbol: false }),
  }));

  // Totais
  const totalReceitas = chartData.reduce((sum, item) => sum + item.receitas, 0);
  const totalDespesas = chartData.reduce((sum, item) => sum + item.despesas, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const yearData = payload[0].payload;

    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-4 shadow-lg min-w-[200px]">
        <p className="text-sm font-semibold text-dark-100 mb-2">{label}</p>
        <div className="space-y-1.5">
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
          <div className="flex items-center justify-between pt-1.5 border-t border-dark-700">
            <span className="text-xs text-dark-400">
              {yearData.saldo >= 0 ? 'Superávit:' : 'Déficit:'}
            </span>
            <span className={`text-sm font-semibold ${yearData.saldo >= 0 ? 'text-revenue-accent' : 'text-expense-accent'}`}>
              {formatCurrency(Math.abs(yearData.saldo))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Comparativo Anual</h3>
        <p className="text-sm text-dark-400">
          Evolução histórica ({periodoInicio}-{periodoFim})
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={CHART_CONFIG.defaults.margin}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.borderDefault}
            vertical={false}
          />

          <XAxis
            dataKey="ano"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.textMuted, fontSize: 12 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.textMuted, fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value, { compact: true, showSymbol: false })}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-dark-300">{value}</span>
            )}
          />

          <Bar
            name="Receitas"
            dataKey="receitas"
            fill={COLORS.revenue.chart.primary}
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            animationDuration={CHART_CONFIG.animation.duration}
          />

          <Bar
            name="Despesas"
            dataKey="despesas"
            fill={COLORS.expense.chart.primary}
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            animationDuration={CHART_CONFIG.animation.duration}
          />

          <Line
            name="Saldo"
            type="monotone"
            dataKey="saldo"
            stroke={COLORS.forecast.chart.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.forecast.chart.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            animationDuration={CHART_CONFIG.animation.duration}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="glass-card p-3">
          <p className="text-xs text-dark-400 mb-1">Total Receitas</p>
          <p className="text-lg font-bold text-revenue-accent">
            {formatCurrency(totalReceitas, { compact: true })}
          </p>
        </div>
        <div className="glass-card p-3">
          <p className="text-xs text-dark-400 mb-1">Total Despesas</p>
          <p className="text-lg font-bold text-expense-DEFAULT">
            {formatCurrency(totalDespesas, { compact: true })}
          </p>
        </div>
      </div>
    </div>
  );
}