'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import ChartTypeSelector, { type ChartTypeOption } from '@/components/ui/ChartTypeSelector';
import { formatCurrency } from '@/lib/utils';
import { COLORS, CHART_CONFIG, MESES_ABREV, API_ENDPOINTS } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';

// ── Tipos ─────────────────────────────────────────────────────

interface KPIsMensal { mes: number; ano: number; total_receitas: number; total_despesas: number; saldo: number }
interface KPIsResponse {
  periodo: string; receitas_total: number; despesas_total: number; saldo: number;
  percentual_execucao_receita: number | null; percentual_execucao_despesa: number | null;
  kpis_mensais: KPIsMensal[] | null;
  kpis_anuais: Array<{ ano: number; total_receitas: number; total_despesas: number; saldo: number }> | null;
}
interface ChartRow { name: string; receitas: number; despesas: number; receitas_anterior?: number; despesas_anterior?: number }
interface PieSlice { name: string; value: number; color: string }
interface TooltipPayload { dataKey: string; value: number; color: string; name?: string }

// ── Fetch & constantes ────────────────────────────────────────

const fetchMonthlyKPIs = (ano: number): Promise<KPIsResponse> =>
  apiClient.get<KPIsResponse>(`${API_ENDPOINTS.dashboard.sazonalidade}${ano}`);

const AXIS_CFG = { axisLine: false, tickLine: false, tick: { fill: COLORS.text.muted, fontSize: 12 } };
const FORMAT_Y = (v: number) => formatCurrency(v, { compact: true, showSymbol: false });
const LEGEND_CFG = { wrapperStyle: { fontSize: 12, color: COLORS.text.muted }, iconType: 'circle' as const, iconSize: 8 };
const ANIM = CHART_CONFIG.animation.duration;
const PREV_REV = '#86efac';
const PREV_DESP = '#fdba74';
const MIN_YEAR = 2013;

const DKL: Record<string, (y: number) => string> = {
  receitas: (y) => `Receitas ${y}`, despesas: (y) => `Despesas ${y}`,
  receitas_anterior: (y) => `Receitas ${y - 1}`, despesas_anterior: (y) => `Despesas ${y - 1}`,
};

// ── Componente ────────────────────────────────────────────────

interface Props { height?: number; className?: string }

export default function CombinedOverviewChart({ height = 300, className = '' }: Props) {
  const [chartType, setChartType] = useState<ChartTypeOption>('bar');
  const { anoSelecionado, compararComAnoAnterior } = useDashboardFilters();
  const isComparing = compararComAnoAnterior && anoSelecionado - 1 >= MIN_YEAR;

  // ── Queries ────────────────────────────────────────────────
  const { data: current, isLoading: loadingCur, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'combined', anoSelecionado, isComparing],
    queryFn: () => fetchMonthlyKPIs(anoSelecionado),
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });
  const { data: previous, isLoading: loadingPrev } = useQuery({
    queryKey: ['kpis', 'mensal', 'combined', anoSelecionado - 1],
    queryFn: () => fetchMonthlyKPIs(anoSelecionado - 1),
    enabled: isComparing, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  if (loadingCur || (isComparing && loadingPrev)) return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
        <p className="text-sm text-dark-400">Carregando dados...</p>
      </div>
      <div className="animate-pulse" style={{ height }}><div className="w-full h-full bg-dark-800/50 rounded" /></div>
    </div>
  );

  if (error || !current?.kpis_mensais) return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
        <p className="text-sm text-red-400">Erro ao carregar dados</p>
      </div>
    </div>
  );

  // ── Merge de dados mensais ──────────────────────────────────
  const prevMap = new Map<number, KPIsMensal>();
  if (isComparing && previous?.kpis_mensais) previous.kpis_mensais.forEach((k) => prevMap.set(k.mes, k));

  const chartData: ChartRow[] = current.kpis_mensais.map((k) => {
    const p = prevMap.get(k.mes);
    return {
      name: MESES_ABREV[k.mes - 1] || `${k.mes}`, receitas: +k.total_receitas, despesas: +k.total_despesas,
      ...(isComparing && p ? { receitas_anterior: +p.total_receitas, despesas_anterior: +p.total_despesas } : {}),
    };
  });

  const totRev = current.receitas_total;
  const totDesp = current.despesas_total;
  const prevTotRev = previous?.receitas_total ?? 0;
  const prevTotDesp = previous?.despesas_total ?? 0;

  const pieData: PieSlice[] = isComparing
    ? [
        { name: `Receitas ${anoSelecionado}`, value: totRev, color: COLORS.revenue.chart.primary },
        { name: `Despesas ${anoSelecionado}`, value: totDesp, color: COLORS.expense.chart.primary },
        { name: `Receitas ${anoSelecionado - 1}`, value: prevTotRev, color: PREV_REV },
        { name: `Despesas ${anoSelecionado - 1}`, value: prevTotDesp, color: PREV_DESP },
      ]
    : [
        { name: 'Total Receitas', value: totRev, color: COLORS.revenue.chart.primary },
        { name: 'Total Despesas', value: totDesp, color: COLORS.expense.chart.primary },
      ];

  // ── Tooltips ────────────────────────────────────────────────
  const resolveLabel = (key: string) => DKL[key]?.(anoSelecionado) ?? key;

  const CTT = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-dark-400 mb-1.5 font-medium">{label}</p>
        <div className="space-y-1">{payload.map((e) => (
          <p key={e.dataKey} className="text-sm font-semibold" style={{ color: e.color }}>
            {resolveLabel(e.dataKey)}: {formatCurrency(e.value)}
          </p>
        ))}</div>
      </div>
    );
  };

  const PTT = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0];
    const lbl = s.name ?? pieData.find((d) => d.value === s.value)?.name ?? 'Valor';
    return <div className="custom-tooltip bg-dark-850 border border-dark-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold" style={{ color: s.color }}>{lbl}: {formatCurrency(s.value)}</p>
    </div>;
  };

  // ── Eixos + Grid reutilizáveis ──────────────────────────────
  const chartBase = (<>
    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.default} vertical={false} />
    <XAxis dataKey="name" {...AXIS_CFG} /><YAxis tickFormatter={FORMAT_Y} {...AXIS_CFG} />
    <Tooltip content={<CTT />} /><Legend {...LEGEND_CFG} />
  </>);

  // ── Render por tipo ─────────────────────────────────────────
  const curN = (b: string) => `${b} ${anoSelecionado}`;
  const prvN = (b: string) => `${b} ${anoSelecionado - 1}`;
  const margin = CHART_CONFIG.defaults.margin;

  const renderChart = () => {
    switch (chartType) {
      case 'bar': return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={margin}>
            {chartBase}
            <Bar dataKey="receitas" name={curN('Receitas')} fill={COLORS.revenue.chart.primary} radius={[4,4,0,0]} animationDuration={ANIM} />
            <Bar dataKey="despesas" name={curN('Despesas')} fill={COLORS.expense.chart.primary} radius={[4,4,0,0]} animationDuration={ANIM} />
            {isComparing && <><Bar dataKey="receitas_anterior" name={prvN('Receitas')} fill={PREV_REV} fillOpacity={0.5} radius={[4,4,0,0]} animationDuration={ANIM} />
            <Bar dataKey="despesas_anterior" name={prvN('Despesas')} fill={PREV_DESP} fillOpacity={0.5} radius={[4,4,0,0]} animationDuration={ANIM} /></>}
          </BarChart>
        </ResponsiveContainer>);
      case 'line': return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={margin}>
            {chartBase}
            <Line type="monotone" dataKey="receitas" name={curN('Receitas')} stroke={COLORS.revenue.chart.primary} strokeWidth={2}
              dot={{ r: 3, fill: COLORS.revenue.chart.primary }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            <Line type="monotone" dataKey="despesas" name={curN('Despesas')} stroke={COLORS.expense.chart.primary} strokeWidth={2}
              dot={{ r: 3, fill: COLORS.expense.chart.primary }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            {isComparing && <><Line type="monotone" dataKey="receitas_anterior" name={prvN('Receitas')} stroke={PREV_REV} strokeWidth={2}
              strokeDasharray="5 5" dot={{ r: 3, fill: PREV_REV }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            <Line type="monotone" dataKey="despesas_anterior" name={prvN('Despesas')} stroke={PREV_DESP} strokeWidth={2}
              strokeDasharray="5 5" dot={{ r: 3, fill: PREV_DESP }} activeDot={{ r: 5 }} animationDuration={ANIM} /></>}
          </LineChart>
        </ResponsiveContainer>);
      case 'area': return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={margin}>
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
            {chartBase}
            <Area type="monotone" dataKey="receitas" name={curN('Receitas')} stroke={COLORS.revenue.chart.primary} strokeWidth={2} fill="url(#combinedRevGrad)" animationDuration={ANIM} />
            <Area type="monotone" dataKey="despesas" name={curN('Despesas')} stroke={COLORS.expense.chart.primary} strokeWidth={2} fill="url(#combinedExpGrad)" animationDuration={ANIM} />
            {isComparing && <><Area type="monotone" dataKey="receitas_anterior" name={prvN('Receitas')} stroke={PREV_REV}
              strokeWidth={2} strokeDasharray="5 5" fill={PREV_REV} fillOpacity={0.1} animationDuration={ANIM} />
            <Area type="monotone" dataKey="despesas_anterior" name={prvN('Despesas')} stroke={PREV_DESP}
              strokeWidth={2} strokeDasharray="5 5" fill={PREV_DESP} fillOpacity={0.1} animationDuration={ANIM} /></>}
          </AreaChart>
        </ResponsiveContainer>);
      case 'pie': return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
              dataKey="value" nameKey="name" paddingAngle={3} animationDuration={ANIM}>
              {pieData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
            </Pie>
            <Tooltip content={<PTT />} /><Legend {...LEGEND_CFG} />
          </PieChart>
        </ResponsiveContainer>);
      default: return null;
    }
  };

  // ── Layout principal ────────────────────────────────────────
  const subtitle = isComparing
    ? `Visão consolidada - ${anoSelecionado} vs ${anoSelecionado - 1}`
    : `Visão consolidada - ${anoSelecionado}`;

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-100">Receitas x Despesas</h3>
          <p className="text-sm text-dark-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <Badge label={`Rec ${anoSelecionado}:`} value={totRev} color={COLORS.revenue.chart.primary} />
            <Badge label={`Desp ${anoSelecionado}:`} value={totDesp} color={COLORS.expense.chart.primary} />
            {isComparing && (<>
              <Badge label={`Rec ${anoSelecionado-1}:`} value={prevTotRev} color={PREV_REV} />
              <Badge label={`Desp ${anoSelecionado-1}:`} value={prevTotDesp} color={PREV_DESP} />
            </>)}
          </div>
          <ChartTypeSelector value={chartType} onChange={setChartType} />
        </div>
      </div>
      {renderChart()}
    </div>
  );
}

// ── Badge de total no header ──────────────────────────────────

function Badge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-dark-400">{label}</span>
      <span className="font-semibold" style={{ color }}>{formatCurrency(value, { compact: true })}</span>
    </div>
  );
}
