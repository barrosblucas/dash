'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import type { TimeSeriesDatum } from '@/types';

interface RevenueChartProps {
  data?: TimeSeriesDatum[];
  height?: number;
  showForecast?: boolean;
  className?: string;
}

// Dados mock para desenvolvimento
const mockData: TimeSeriesDatum[] = [
  { date: new Date('2024-01'), value: 9500000, label: 'Jan' },
  { date: new Date('2024-02'), value: 10200000, label: 'Fev' },
  { date: new Date('2024-03'), value: 9800000, label: 'Mar' },
  { date: new Date('2024-04'), value: 10500000, label: 'Abr' },
  { date: new Date('2024-05'), value: 11000000, label: 'Mai' },
  { date: new Date('2024-06'), value: 10800000, label: 'Jun' },
  { date: new Date('2024-07'), value: 11200000, label: 'Jul' },
  { date: new Date('2024-08'), value: 11500000, label: 'Ago' },
  { date: new Date('2024-09'), value: 11800000, label: 'Set' },
  { date: new Date('2024-10'), value: 12000000, label: 'Out' },
  { date: new Date('2024-11'), value: 12200000, label: 'Nov' },
  { date: new Date('2024-12'), value: 12500000, label: 'Dez' },
];

export default function RevenueChart({
  data = mockData,
  height = 300,
  showForecast = true,
  className = '',
}: RevenueChartProps) {
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
        <p className="text-sm font-semibold text-revenue-accent">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  };

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Receitas</h3>
        <p className="text-sm text-dark-400">Evolução mensal</p>
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
          </defs>

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

          <Area
            type="monotone"
            dataKey="value"
            stroke={COLORS.revenue.chart.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={CHART_CONFIG.animation.duration}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}