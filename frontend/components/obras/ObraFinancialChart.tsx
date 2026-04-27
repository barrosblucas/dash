'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { ObraMedicao } from '@/types/obra';
import { formatCurrency } from '@/lib/utils';

const COLOR_PRIMARY = '#00193c';
const COLOR_SECONDARY = '#006c47';

interface ObraFinancialChartProps {
  medicoes: ObraMedicao[];
}

interface ChartPoint {
  label: string;
  valor: number;
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  color?: string;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl border border-outline/20 bg-surface-container-lowest/95 backdrop-blur-xl px-4 py-3 shadow-ambient">
      <p className="text-label-md font-medium text-on-surface mb-1.5">{label}</p>
      <p className="text-body-sm font-semibold text-on-surface">
        {formatCurrency(entry.value)}
      </p>
    </div>
  );
}

function buildChartData(medicoes: ObraMedicao[]): ChartPoint[] {
  const sorted = [...medicoes].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) return a.ano_referencia - b.ano_referencia;
    return a.mes_referencia - b.mes_referencia;
  });

  const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return sorted.map((m) => {
    const mes = mesesAbrev[m.mes_referencia - 1] ?? `${m.mes_referencia}`;
    return {
      label: `${mes}/${m.ano_referencia}`,
      valor: m.valor_medicao,
    };
  });
}

export default function ObraFinancialChart({ medicoes }: ObraFinancialChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (medicoes.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-8">
        <div className="mb-6">
          <h3 className="text-title-md font-display text-on-surface">Desembolso Financeiro Mensal</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Valores das medições por período</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px] mb-3">payments</span>
          <p className="text-on-surface-variant font-medium mb-1">Nenhuma medição registrada</p>
          <p className="text-sm text-on-surface-variant/60">As medições aparecerão aqui quando forem cadastradas</p>
        </div>
      </div>
    );
  }

  const data = buildChartData(medicoes);

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-8">
      <div className="mb-6">
        <h3 className="text-title-md font-display text-on-surface">Desembolso Financeiro Mensal</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">Valores das medições por período</p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            onMouseMove={(state) => {
              if (state && typeof state.activeTooltipIndex === 'number') {
                setHoveredIndex(state.activeTooltipIndex);
              } else {
                setHoveredIndex(null);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e3eb" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(v: number) => formatCurrency(v, { compact: true, showSymbol: false })}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} animationDuration={500}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoveredIndex === index ? COLOR_SECONDARY : COLOR_PRIMARY}
                  style={{ transition: 'fill 200ms ease' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type { ObraFinancialChartProps };
export { buildChartData };
