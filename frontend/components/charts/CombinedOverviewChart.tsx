'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import ChartTypeSelector, { type ChartTypeOption } from '@/components/ui/ChartTypeSelector';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG, MESES_ABREV } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';

// ── Tipos ─────────────────────────────────────────────────────

interface KPIsMensal {
  mes: number; ano: number;
  total_receitas: number; total_despesas: number; saldo: number;
}

interface KPIsResponse {
  periodo: string;
  receitas_total: number; despesas_total: number; saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: KPIsMensal[] | null;
  kpis_anuais: Array<{ ano: number; total_receitas: number; total_despesas: number; saldo: number }> | null;
}

interface ChartRow { name: string; receitas: number; despesas: number }
interface PieSlice { name: string; value: number; color: string }

interface TooltipPayload {
  dataKey: string; value: number; color: string; name?: string;
}

// ── Fetch ─────────────────────────────────────────────────────

const fetchMonthlyKPIs = (ano: number): Promise<KPIsResponse> =>
  apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);

// ── Constantes de eixo ────────────────────────────────────────

const AXIS_BASE = { axisLine: false, tickLine: false, tick: { fill: COLORS.text.muted, fontSize: 12 } };
const Y_FORMATTER = (v: number) => formatCurrency(v, { compact: true, showSymbol: false });
const LEGEND_PROPS = { wrapperStyle: { fontSize: 12, color: COLORS.text.muted }, iconType: 'circle' as const, iconSize: 8 };
const ANIM = CHART_CONFIG.animation.duration;

// ── Componente ────────────────────────────────────────────────

interface Props { height?: number; className?: string }

export default function CombinedOverviewChart({ height = 300, className = '' }: Props) {
  const [chartType, setChartType] = useState<ChartTypeOption>('bar');
  const { anoSelecionado } = useDashboardFilters();

  const { data, isLoading, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'combined', anoSelecionado],
    queryFn: () => fetchMonthlyKPIs(anoSelecionado),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
          <p className="text-sm text-dark-400">Carregando dados...</p>
        </div>
        <div className="animate-pulse" style={{ height }}>
          <div className="w-full h-full bg-dark-800/50 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data?.kpis_mensais) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
          <p className="text-sm text-red-400">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  // ── Dados mensais ───────────────────────────────────────────

  const chartData: ChartRow[] = data.kpis_mensais.map((k) => ({
    name: MESES_ABREV[k.mes - 1] || `${k.mes}`,
    receitas: Number(k.total_receitas),
    despesas: Number(k.total_despesas),
  }));

  const totalReceitas = data.receitas_total;
  const totalDespesas = data.despesas_total;

  const pieData: PieSlice[] = [
    { name: 'Total Receitas', value: totalReceitas, color: COLORS.revenue.chart.primary },
    { name: 'Total Despesas', value: totalDespesas, color: COLORS.expense.chart.primary },
  ];

  // ── Tooltip mensal ──────────────────────────────────────────

  const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-dark-400 mb-1.5 font-medium">{label}</p>
        <div className="space-y-1">
          {payload.map((e) => (
            <p key={e.dataKey} className="text-sm font-semibold" style={{ color: e.color }}>
              {e.dataKey === 'receitas' ? 'Receitas' : 'Despesas'}: {formatCurrency(e.value)}
            </p>
          ))}
        </div>
      </div>
    );
  };

  // ── Tooltip pizza ───────────────────────────────────────────

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0];
    const label = pieData.find((d) => d.value === s.value)?.name ?? 'Valor';
    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold" style={{ color: s.color }}>{label}: {formatCurrency(s.value)}</p>
      </div>
    );
  };

  // ── Eixos + Grid reutilizáveis ──────────────────────────────

  const cartesianBase = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.default} vertical={false} />
      <XAxis dataKey="name" {...AXIS_BASE} />
      <YAxis tickFormatter={Y_FORMATTER} {...AXIS_BASE} />
      <Tooltip content={<ChartTooltip />} />
      <Legend {...LEGEND_PROPS} />
    </>
  );

  // ── Render por tipo ─────────────────────────────────────────

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={CHART_CONFIG.defaults.margin}>
              {cartesianBase}
              <Bar dataKey="receitas" name="Receitas" fill={COLORS.revenue.chart.primary} radius={[4, 4, 0, 0]} animationDuration={ANIM} />
              <Bar dataKey="despesas" name="Despesas" fill={COLORS.expense.chart.primary} radius={[4, 4, 0, 0]} animationDuration={ANIM} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={CHART_CONFIG.defaults.margin}>
              {cartesianBase}
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke={COLORS.revenue.chart.primary} strokeWidth={2}
                dot={{ r: 3, fill: COLORS.revenue.chart.primary }} activeDot={{ r: 5 }} animationDuration={ANIM} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke={COLORS.expense.chart.primary} strokeWidth={2}
                dot={{ r: 3, fill: COLORS.expense.chart.primary }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={CHART_CONFIG.defaults.margin}>
              <defs>
                <linearGradient id="combinedRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.revenue.chart.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="combinedExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.expense.chart.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.expense.chart.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              {cartesianBase}
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke={COLORS.revenue.chart.primary}
                strokeWidth={2} fill="url(#combinedRevGrad)" animationDuration={ANIM} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke={COLORS.expense.chart.primary}
                strokeWidth={2} fill="url(#combinedExpGrad)" animationDuration={ANIM} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" nameKey="name" paddingAngle={3} animationDuration={ANIM}>
                {pieData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend {...LEGEND_PROPS} />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  // ── Layout principal ────────────────────────────────────────

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
          <p className="text-sm text-dark-400">Visão consolidada - {anoSelecionado}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.revenue.chart.primary }} />
              <span className="text-dark-400">Rec:</span>
              <span className="font-semibold" style={{ color: COLORS.revenue.chart.primary }}>
                {formatCurrency(totalReceitas, { compact: true })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.expense.chart.primary }} />
              <span className="text-dark-400">Desp:</span>
              <span className="font-semibold" style={{ color: COLORS.expense.chart.primary }}>
                {formatCurrency(totalDespesas, { compact: true })}
              </span>
            </div>
          </div>
          <ChartTypeSelector value={chartType} onChange={setChartType} />
        </div>
      </div>
      {renderChart()}
    </div>
  );
}
