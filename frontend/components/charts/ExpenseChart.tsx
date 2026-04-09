'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

async function fetchMonthlyExpense(ano: number): Promise<KPIsResponse> {
  const response = await apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
  return response;
}

interface ExpenseChartProps {
  height?: number;
  className?: string;
}

export default function ExpenseChart({
  height = 300,
  className = '',
}: ExpenseChartProps) {
  const { anoSelecionado, compararComAnoAnterior } = useDashboardFilters();

  // Buscar dados do ano selecionado
  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'despesas', anoSelecionado],
    queryFn: () => fetchMonthlyExpense(anoSelecionado),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Buscar dados do ano anterior para comparação
  const anoAnterior = anoSelecionado - 1;
  const { data: kpisAnterior } = useQuery({
    queryKey: ['kpis', 'mensal', 'despesas', anoAnterior],
    queryFn: () => fetchMonthlyExpense(anoAnterior),
    enabled: compararComAnoAnterior,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Despesas</h3>
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
          <h3 className="text-lg font-semibold text-dark-100">Despesas</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = kpisResponse.kpis_mensais.map((kpi, index) => {
    const mesAnterior = kpisAnterior?.kpis_mensais?.find(m => m.mes === kpi.mes);
    
    return {
      mes: kpi.mes,
      name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
      despesas: Number(kpi.total_despesas),
      despesasAnterior: mesAnterior ? Number(mesAnterior.total_despesas) : undefined,
      despesasFormatado: formatCurrency(kpi.total_despesas, { compact: true, showSymbol: false }),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const despesas = payload[0]?.value;
    const despesasAnterior = payload[1]?.value;

    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-dark-400 mb-1 font-medium">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-expense-DEFAULT">
            {`${anoSelecionado}: ${formatCurrency(despesas)}`}
          </p>
          {compararComAnoAnterior && despesasAnterior && (
            <p className="text-xs text-dark-400">
              {`${anoAnterior}: ${formatCurrency(despesasAnterior)}`}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Total do ano
  const totalAno = chartData.reduce((sum, item) => sum + item.despesas, 0);

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-100">Despesas</h3>
          <p className="text-sm text-dark-400">Execução orçamentária - {anoSelecionado}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-dark-400">Total {anoSelecionado}</p>
          <p className="text-lg font-bold text-expense-DEFAULT">
            {formatCurrency(totalAno, { compact: true })}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={CHART_CONFIG.defaults.margin}
        >
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
            <Bar
              dataKey="despesasAnterior"
              fill={COLORS.expense.chart.primary}
              fillOpacity={0.3}
              radius={[4, 4, 0, 0]}
              animationDuration={CHART_CONFIG.animation.duration}
            />
          )}

          <Bar
            dataKey="despesas"
            fill={COLORS.expense.chart.primary}
            radius={[4, 4, 0, 0]}
            animationDuration={CHART_CONFIG.animation.duration}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS.expense.chart.primary}
                fillOpacity={0.8 + (index * 0.015)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {compararComAnoAnterior && (
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-dark-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-expense-DEFAULT rounded opacity-80"></div>
            <span>{anoSelecionado}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-expense-DEFAULT rounded opacity-30"></div>
            <span>{anoAnterior}</span>
          </div>
        </div>
      )}
    </div>
  );
}
