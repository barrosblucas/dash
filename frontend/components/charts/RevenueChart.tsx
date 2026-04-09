'use client';

import { useQuery } from '@tanstack/react-query';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';

interface KPIsMensal {
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
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: KPIsMensal[] | null;
  kpis_anuais: Array<{
    ano: number;
    total_receitas: number;
    total_despesas: number;
    saldo: number;
  }> | null;
}

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

async function fetchMonthlyRevenue(ano: number): Promise<KPIsResponse> {
  const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
  return response;
}

interface RevenueChartProps {
  height?: number;
  className?: string;
}

export default function RevenueChart({
  height = 300,
  className = '',
}: RevenueChartProps) {
  const { anoSelecionado, compararComAnoAnterior } = useDashboardFilters();

  // Buscar dados do ano selecionado
  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'receitas', anoSelecionado],
    queryFn: () => fetchMonthlyRevenue(anoSelecionado),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Buscar dados do ano anterior para comparação
  const anoAnterior = anoSelecionado - 1;
  const { data: kpisAnterior } = useQuery({
    queryKey: ['kpis', 'mensal', 'receitas', anoAnterior],
    queryFn: () => fetchMonthlyRevenue(anoAnterior),
    enabled: compararComAnoAnterior,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Receitas</h3>
          <p className="text-sm text-dark-400">Carregando dados...</p>
        </div>
        <div className="animate-pulse" style={{ height }}>
          <div className="w-full h-full bg-dark-800/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !kpisResponse?.kpis_mensais) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Receitas</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = kpisResponse.kpis_mensais.map((kpi) => {
    const mesAnterior = kpisAnterior?.kpis_mensais?.find(m => m.mes === kpi.mes);
    
    return {
      mes: kpi.mes,
      name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
      receitas: Number(kpi.total_receitas),
      receitasAnterior: mesAnterior ? Number(mesAnterior.total_receitas) : undefined,
      receitasFormatado: formatCurrency(kpi.total_receitas, { compact: true, showSymbol: false }),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const receitas = payload[0]?.value;
    const receitasAnterior = payload[1]?.value;

    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-dark-400 mb-1 font-medium">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-revenue-accent">
            {`${anoSelecionado}: ${formatCurrency(receitas)}`}
          </p>
          {compararComAnoAnterior && receitasAnterior && (
            <p className="text-xs text-dark-400">
              {`${anoAnterior}: ${formatCurrency(receitasAnterior)}`}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Total do ano
  const totalAno = chartData.reduce((sum, item) => sum + item.receitas, 0);

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-100">Receitas</h3>
          <p className="text-sm text-dark-400">Evolução mensal - {anoSelecionado}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-dark-400">Total {anoSelecionado}</p>
          <p className="text-lg font-bold text-revenue-accent">
            {formatCurrency(totalAno, { compact: true })}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={CHART_CONFIG.defaults.margin}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0} />
            </linearGradient>
            {compararComAnoAnterior && (
              <linearGradient id="colorRevenueAnterior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border.default}
            vertical={false}
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: COLORS.text.muted, fontSize: 12 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: COLORS.text.muted, fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value, { compact: true, showSymbol: false })}
          />

          <Tooltip content={<CustomTooltip />} />

          {compararComAnoAnterior && (
            <Area
              type="monotone"
              dataKey="receitasAnterior"
              stroke={COLORS.revenue.chart.primary}
              strokeOpacity={0.3}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorRevenueAnterior)"
              animationDuration={CHART_CONFIG.animation.duration}
            />
          )}

          <Area
            type="monotone"
            dataKey="receitas"
            stroke={COLORS.revenue.chart.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={CHART_CONFIG.animation.duration}
          />
        </AreaChart>
      </ResponsiveContainer>

      {compararComAnoAnterior && (
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-dark-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-revenue-accent"></div>
            <span>{anoSelecionado}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-revenue-default opacity-50" style={{ borderStyle: 'dashed' }}></div>
            <span>{anoAnterior}</span>
          </div>
        </div>
      )}
    </div>
  );
}
