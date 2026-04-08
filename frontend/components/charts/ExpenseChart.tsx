'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import type { TimeSeriesDatum } from '@/types';

interface ExpenseChartProps {
  data?: TimeSeriesDatum[];
  height?: number;
  className?: string;
}

// Dados mock para desenvolvimento
const mockData: TimeSeriesDatum[] = [
  { date: new Date('2024-01'), value: 9000000, label: 'Jan' },
  { date: new Date('2024-02'), value: 9500000, label: 'Fev' },
  { date: new Date('2024-03'), value: 9200000, label: 'Mar' },
  { date: new Date('2024-04'), value: 9800000, label: 'Abr' },
  { date: new Date('2024-05'), value: 10200000, label: 'Mai' },
  { date: new Date('2024-06'), value: 10100000, label: 'Jun' },
  { date: new Date('2024-07'), value: 10500000, label: 'Jul' },
  { date: new Date('2024-08'), value: 10800000, label: 'Ago' },
  { date: new Date('2024-09'), value: 11000000, label: 'Set' },
  { date: new Date('2024-10'), value: 11200000, label: 'Out' },
  { date: new Date('2024-11'), value: 11500000, label: 'Nov' },
  { date: new Date('2024-12'), value: 11800000, label: 'Dez' },
];

export default function ExpenseChart({
  data = mockData,
  height = 300,
  className = '',
}: ExpenseChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: item.label || `${item.date.getMonth() + 1}/${item.date.getFullYear()}`,
    formattedValue: formatCurrency(item.value, { compact: true, showSymbol: false }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-dark-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-expense-DEFAULT">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  };

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Despesas</h3>
        <p className="text-sm text-dark-400">Execução orçamentária</p>
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
            dataKey="formattedDate"
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

          <Bar
            dataKey="value"
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
    </div>
  );
}