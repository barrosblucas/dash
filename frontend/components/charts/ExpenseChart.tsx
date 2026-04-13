'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar, BarChart, Line, LineChart, Area, AreaChart,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';
import ChartTypeSelector, { ChartTypeOption } from '@/components/ui/ChartTypeSelector';

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
  kpis_anuais: Array<{ ano: number; total_receitas: number; total_despesas: number; saldo: number }> | null;
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Paleta em tons de laranja para PieChart */
const PIE_COLORS = [
  '#f97316', '#ea580c', '#fb923c', '#c2410c',
  '#fdba74', '#9a3412', '#fed7aa', '#7c2d12',
  '#ff6b35', '#d97706', '#f59e0b', '#b45309',
];

async function fetchMonthlyExpense(ano: number): Promise<KPIsResponse> {
  return apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
}

interface ExpenseChartProps { height?: number; className?: string }

// --- Tipos e componentes de tooltip (tipagem estrita, sem any) ---

interface TooltipPayloadEntry { value: number; dataKey: string; color?: string; name?: string }

interface CartesianTooltipProps {
  active?: boolean; payload?: TooltipPayloadEntry[]; label?: string;
  anoSelecionado: number; anoAnterior: number; compararComAnoAnterior: boolean;
}

function CartesianCustomTooltip({ active, payload, label, anoSelecionado, anoAnterior, compararComAnoAnterior }: CartesianTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-dark-400 mb-1 font-medium">{label}</p>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-expense-DEFAULT">
          {`${anoSelecionado}: ${formatCurrency(payload[0].value)}`}
        </p>
        {compararComAnoAnterior && payload[1]?.value !== undefined && (
          <p className="text-xs text-dark-400">{`${anoAnterior}: ${formatCurrency(payload[1].value)}`}</p>
        )}
      </div>
    </div>
  );
}

interface PieTooltipPayload { mes: number; name: string; despesas: number; percentual: number }

function PieCustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PieTooltipPayload }> }) {
  if (!active || !payload?.length) return null;
  const e = payload[0].payload;
  return (
    <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-dark-400 mb-1 font-medium">{e.name}</p>
      <p className="text-sm font-semibold text-expense-DEFAULT">{formatCurrency(e.despesas)}</p>
      <p className="text-xs text-dark-400">{`${e.percentual.toFixed(1)}% do total`}</p>
    </div>
  );
}

// --- Tipos para PieLabel ---

interface PieLabelProps {
  cx: number; cy: number; midAngle: number; innerRadius: number;
  outerRadius: number; percent: number; name: string;
}

// --- Componente principal ---

export default function ExpenseChart({ height = 300, className = '' }: ExpenseChartProps) {
  const { anoSelecionado, compararComAnoAnterior } = useDashboardFilters();
  const [chartType, setChartType] = useState<ChartTypeOption>('bar');
  const chartColors = useChartThemeColors();
  const anoAnterior = anoSelecionado - 1;

  // Label do PieChart (usa chartColors para tema adaptável)
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: PieLabelProps) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill={chartColors.pieLabel} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'despesas', anoSelecionado],
    queryFn: () => fetchMonthlyExpense(anoSelecionado),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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
          <div className="w-full h-full bg-dark-800/50 rounded" />
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

  const isCartesian = chartType !== 'pie';
  const totalAno = kpisResponse.kpis_mensais.reduce((s, k) => s + Number(k.total_despesas), 0);

  // Dados cartesianos (bar, line, area)
  const cartesianData = kpisResponse.kpis_mensais.map((kpi) => {
    const anterior = kpisAnterior?.kpis_mensais?.find((m) => m.mes === kpi.mes);
    return {
      mes: kpi.mes,
      name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
      despesas: Number(kpi.total_despesas),
      despesasAnterior: anterior ? Number(anterior.total_despesas) : undefined,
    };
  });

  // Dados do pie — cada mês é uma fatia (apenas ano selecionado)
  const pieData = kpisResponse.kpis_mensais.map((kpi) => ({
    mes: kpi.mes,
    name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
    despesas: Number(kpi.total_despesas),
    percentual: totalAno > 0 ? (Number(kpi.total_despesas) / totalAno) * 100 : 0,
  }));

  // Eixos e grid compartilhados entre cartesianos
  const sharedXAxis = <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartColors.textMuted, fontSize: 12 }} />;
  const sharedYAxis = (
    <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.textMuted, fontSize: 12 }}
      tickFormatter={(v: number) => formatCurrency(v, { compact: true, showSymbol: false })} />
  );
  const sharedGrid = <CartesianGrid strokeDasharray="3 3" stroke={chartColors.borderDefault} vertical={false} />;
  const sharedTooltip = (
    <Tooltip content={<CartesianCustomTooltip anoSelecionado={anoSelecionado} anoAnterior={anoAnterior} compararComAnoAnterior={compararComAnoAnterior} />} />
  );

  // Gradientes para AreaChart
  const gradientDefs = (
    <defs>
      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={COLORS.expense.chart.primary} stopOpacity={0.3} />
        <stop offset="95%" stopColor={COLORS.expense.chart.primary} stopOpacity={0} />
      </linearGradient>
      {compararComAnoAnterior && (
        <linearGradient id="colorExpenseAnterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLORS.expense.chart.primary} stopOpacity={0.15} />
          <stop offset="95%" stopColor={COLORS.expense.chart.primary} stopOpacity={0} />
        </linearGradient>
      )}
    </defs>
  );

  const anim = CHART_CONFIG.animation.duration;
  const margin = CHART_CONFIG.defaults.margin;
  const primary = COLORS.expense.chart.primary;

  function renderChart() {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={cartesianData} margin={margin}>
              {gradientDefs}{sharedGrid}{sharedXAxis}{sharedYAxis}{sharedTooltip}
              {compararComAnoAnterior && (
                <Bar dataKey="despesasAnterior" fill={primary} fillOpacity={0.2}
                  stroke={primary} strokeOpacity={0.3} strokeDasharray="5 5" animationDuration={anim} />
              )}
              <Bar dataKey="despesas" fill={primary} radius={[4, 4, 0, 0]} animationDuration={anim}>
                {cartesianData.map((e, i) => <Cell key={`cell-${e.mes}`} fill={primary} fillOpacity={0.8 + i * 0.015} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={cartesianData} margin={margin}>
              {sharedGrid}{sharedXAxis}{sharedYAxis}{sharedTooltip}
              {compararComAnoAnterior && (
                <Line type="monotone" dataKey="despesasAnterior" stroke={primary} strokeOpacity={0.3}
                  strokeDasharray="5 5" dot={false} animationDuration={anim} />
              )}
              <Line type="monotone" dataKey="despesas" stroke={primary} strokeWidth={2}
                dot={{ fill: primary, r: 3 }} activeDot={{ r: 5 }} animationDuration={anim} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                dataKey="despesas" nameKey="name" label={renderPieLabel} labelLine={false} animationDuration={anim}>
                {pieData.map((e, i) => <Cell key={`cell-${e.mes}`} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<PieCustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} formatter={(v: string) => <span className="text-xs text-dark-400">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={cartesianData} margin={margin}>
              {gradientDefs}{sharedGrid}{sharedXAxis}{sharedYAxis}{sharedTooltip}
              {compararComAnoAnterior && (
                <Area type="monotone" dataKey="despesasAnterior" stroke={primary} strokeOpacity={0.3}
                  strokeDasharray="5 5" fillOpacity={1} fill="url(#colorExpenseAnterior)" animationDuration={anim} />
              )}
              <Area type="monotone" dataKey="despesas" stroke={primary} strokeWidth={2}
                fillOpacity={1} fill="url(#colorExpense)" animationDuration={anim} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  }

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-100">Despesas</h3>
          <p className="text-sm text-dark-400">Execução orçamentária - {anoSelecionado}</p>
        </div>
        <div className="flex items-center gap-4">
          <ChartTypeSelector value={chartType} onChange={setChartType} />
          <div className="text-right">
            <p className="text-xs text-dark-400">Total {anoSelecionado}</p>
            <p className="text-lg font-bold text-expense-DEFAULT">{formatCurrency(totalAno, { compact: true })}</p>
          </div>
        </div>
      </div>
      {renderChart()}
      {isCartesian && compararComAnoAnterior && (
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-dark-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-expense-DEFAULT rounded opacity-80" /><span>{anoSelecionado}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-expense-DEFAULT rounded opacity-30" /><span>{anoAnterior}</span>
          </div>
        </div>
      )}
    </div>
  );
}
