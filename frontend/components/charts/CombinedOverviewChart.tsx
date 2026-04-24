'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import ChartTypeSelector, { type ChartTypeOption } from '@/components/ui/ChartTypeSelector';
import { formatCurrency } from '@/lib/utils';
import { CHART_CONFIG, MESES_ABREV, API_ENDPOINTS, PERIODO_DADOS } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';

// ── Tipos ─────────────────────────────────────────────────────

interface KPIsMensal { mes: number; ano: number; total_receitas: number; total_despesas: number; saldo: number }
interface KPIsResponse {
  periodo: string; receitas_total: number; despesas_total: number; saldo: number;
  percentual_execucao_receita: number | null; percentual_execucao_despesa: number | null;
  kpis_mensais: KPIsMensal[] | null;
  kpis_anuais: Array<{ ano: number; total_receitas: number; total_despesas: number; saldo: number }> | null;
}
interface ChartRow { name: string; receitas: number; despesas: number; receitas_comp?: number; despesas_comp?: number }
interface PieSlice { name: string; value: number; color: string }
interface TooltipPayload { dataKey: string; value: number; color: string; name?: string }

// ── Fetch & constantes ────────────────────────────────────────

const fetchMonthlyKPIs = (ano: number): Promise<KPIsResponse> =>
  apiClient.get<KPIsResponse>(`${API_ENDPOINTS.dashboard.sazonalidade}/${ano}`);

const FORMAT_Y = (v: number) => formatCurrency(v, { compact: true, showSymbol: false });
const ANIM = CHART_CONFIG.animation.duration;
const MIN_YEAR = PERIODO_DADOS.ano_inicio;

const REVENUE_PRIMARY = '#006c47';
const EXPENSE_PRIMARY = '#ba1a1a';
const COMP_REV = '#8acfae';
const COMP_DESP = '#eea99e';

// ── Componente ────────────────────────────────────────────────

interface Props { height?: number; className?: string }

export default function CombinedOverviewChart({ height = 320, className = '' }: Props) {
  const [chartType, setChartType] = useState<ChartTypeOption>('bar');
  const { anoSelecionado } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const chartColors = useChartThemeColors();

  // Estado local do modo comparativo
  const [modoComparativo, setModoComparativo] = useState(false);
  const [anoBase, setAnoBase] = useState(anoSelecionado);
  const [anoComparativo, setAnoComparativo] = useState(anoSelecionado - 1);

  const anoAtivo = modoComparativo ? anoBase : anoSelecionado;
  const isComparing = modoComparativo && anoComparativo >= MIN_YEAR && anoComparativo !== anoBase;

  const AXIS_CFG = { axisLine: false, tickLine: false, tick: { fill: chartColors.textMuted, fontSize: 12 } };
  const LEGEND_CFG = { wrapperStyle: { fontSize: 12, color: chartColors.textMuted }, iconType: 'circle' as const, iconSize: 8 };

  const { data: current, isLoading: loadingCur, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'combined', anoAtivo, isComparing],
    queryFn: () => fetchMonthlyKPIs(anoAtivo),
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });
  const { data: compareData, isLoading: loadingComp } = useQuery({
    queryKey: ['kpis', 'mensal', 'combined', anoComparativo],
    queryFn: () => fetchMonthlyKPIs(anoComparativo),
    enabled: isComparing, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  if (loadingCur || (isComparing && loadingComp)) return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-title-md font-display text-on-surface">Receitas x Despesas</h3>
        <p className="text-body-sm text-on-surface-variant">Carregando dados...</p>
      </div>
      <div className="animate-pulse" style={{ height }}><div className="w-full h-full bg-surface-container-high/60 rounded-xl" /></div>
    </div>
  );

  if (error || !current?.kpis_mensais) return (
    <div className={`chart-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-title-md font-display text-on-surface">Receitas x Despesas</h3>
        <p className="text-body-sm text-error">Erro ao carregar dados</p>
      </div>
    </div>
  );

  const compMap = new Map<number, KPIsMensal>();
  if (isComparing && compareData?.kpis_mensais) compareData.kpis_mensais.forEach((k) => compMap.set(k.mes, k));

  const chartData: ChartRow[] = current.kpis_mensais.map((k) => {
    const c = compMap.get(k.mes);
    return {
      name: MESES_ABREV[k.mes - 1] || `${k.mes}`, receitas: +k.total_receitas, despesas: +k.total_despesas,
      ...(isComparing && c ? { receitas_comp: +c.total_receitas, despesas_comp: +c.total_despesas } : {}),
    };
  });

  const totRev = current.receitas_total;
  const totDesp = current.despesas_total;
  const compTotRev = compareData?.receitas_total ?? 0;
  const compTotDesp = compareData?.despesas_total ?? 0;

  const pieData: PieSlice[] = isComparing
    ? [
        { name: `Receitas ${anoAtivo}`, value: totRev, color: REVENUE_PRIMARY },
        { name: `Despesas ${anoAtivo}`, value: totDesp, color: EXPENSE_PRIMARY },
        { name: `Receitas ${anoComparativo}`, value: compTotRev, color: COMP_REV },
        { name: `Despesas ${anoComparativo}`, value: compTotDesp, color: COMP_DESP },
      ]
    : [
        { name: 'Total Receitas', value: totRev, color: REVENUE_PRIMARY },
        { name: 'Total Despesas', value: totDesp, color: EXPENSE_PRIMARY },
      ];

  const CTT = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="text-label-md text-on-surface-variant mb-1.5 font-medium">{label}</p>
        <div className="space-y-1">{payload.map((e) => (
          <p key={e.dataKey} className="text-body-sm font-semibold" style={{ color: e.color }}>
            {e.name}: {formatCurrency(e.value)}
          </p>
        ))}</div>
      </div>
    );
  };

  const PTT = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0];
    const lbl = s.name ?? pieData.find((d) => d.value === s.value)?.name ?? 'Valor';
    return <div className="custom-tooltip">
      <p className="text-body-sm font-semibold" style={{ color: s.color }}>{lbl}: {formatCurrency(s.value)}</p>
    </div>;
  };

  const chartBase = (<>
    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.borderDefault} vertical={false} />
    <XAxis dataKey="name" {...AXIS_CFG} /><YAxis tickFormatter={FORMAT_Y} {...AXIS_CFG} />
    <Tooltip content={<CTT />} /><Legend {...LEGEND_CFG} />
  </>);

  const curN = (b: string) => `${b} ${anoAtivo}`;
  const compN = (b: string) => `${b} ${anoComparativo}`;
  const margin = CHART_CONFIG.defaults.margin;

  const renderChart = () => {
    switch (chartType) {
      case 'bar': return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={margin}>
            {chartBase}
            <Bar dataKey="receitas" name={curN('Receitas')} fill={REVENUE_PRIMARY} radius={[4,4,0,0]} animationDuration={ANIM} />
            <Bar dataKey="despesas" name={curN('Despesas')} fill={EXPENSE_PRIMARY} radius={[4,4,0,0]} animationDuration={ANIM} />
            {isComparing && <><Bar dataKey="receitas_comp" name={compN('Receitas')} fill={COMP_REV} fillOpacity={0.6} radius={[4,4,0,0]} animationDuration={ANIM} />
            <Bar dataKey="despesas_comp" name={compN('Despesas')} fill={COMP_DESP} fillOpacity={0.6} radius={[4,4,0,0]} animationDuration={ANIM} /></>}
          </BarChart>
        </ResponsiveContainer>);
      case 'line': return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={margin}>
            {chartBase}
            <Line type="monotone" dataKey="receitas" name={curN('Receitas')} stroke={REVENUE_PRIMARY} strokeWidth={2}
              dot={{ r: 3, fill: REVENUE_PRIMARY }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            <Line type="monotone" dataKey="despesas" name={curN('Despesas')} stroke={EXPENSE_PRIMARY} strokeWidth={2}
              dot={{ r: 3, fill: EXPENSE_PRIMARY }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            {isComparing && <><Line type="monotone" dataKey="receitas_comp" name={compN('Receitas')} stroke={COMP_REV} strokeWidth={2}
              strokeDasharray="5 5" dot={{ r: 3, fill: COMP_REV }} activeDot={{ r: 5 }} animationDuration={ANIM} />
            <Line type="monotone" dataKey="despesas_comp" name={compN('Despesas')} stroke={COMP_DESP} strokeWidth={2}
              strokeDasharray="5 5" dot={{ r: 3, fill: COMP_DESP }} activeDot={{ r: 5 }} animationDuration={ANIM} /></>}
          </LineChart>
        </ResponsiveContainer>);
      case 'area': return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={margin}>
            <defs>
              <linearGradient id="combinedRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={REVENUE_PRIMARY} stopOpacity={0.3} />
                <stop offset="95%" stopColor={REVENUE_PRIMARY} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="combinedExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={EXPENSE_PRIMARY} stopOpacity={0.3} />
                <stop offset="95%" stopColor={EXPENSE_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            {chartBase}
            <Area type="monotone" dataKey="receitas" name={curN('Receitas')} stroke={REVENUE_PRIMARY} strokeWidth={2} fill="url(#combinedRevGrad)" animationDuration={ANIM} />
            <Area type="monotone" dataKey="despesas" name={curN('Despesas')} stroke={EXPENSE_PRIMARY} strokeWidth={2} fill="url(#combinedExpGrad)" animationDuration={ANIM} />
            {isComparing && <><Area type="monotone" dataKey="receitas_comp" name={compN('Receitas')} stroke={COMP_REV}
              strokeWidth={2} strokeDasharray="5 5" fill={COMP_REV} fillOpacity={0.1} animationDuration={ANIM} />
            <Area type="monotone" dataKey="despesas_comp" name={compN('Despesas')} stroke={COMP_DESP}
              strokeWidth={2} strokeDasharray="5 5" fill={COMP_DESP} fillOpacity={0.1} animationDuration={ANIM} /></>}
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

  const subtitle = isComparing
    ? `Visão consolidada — ${anoAtivo} vs ${anoComparativo}`
    : `Visão consolidada — ${anoAtivo}`;

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-title-md font-display text-on-surface">Receitas x Despesas</h3>
          <p className="text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-label-md">
            <Badge label={`Rec ${anoAtivo}:`} value={totRev} color={REVENUE_PRIMARY} />
            <Badge label={`Desp ${anoAtivo}:`} value={totDesp} color={EXPENSE_PRIMARY} />
            {isComparing && (<>
              <Badge label={`Rec ${anoComparativo}:`} value={compTotRev} color={COMP_REV} />
              <Badge label={`Desp ${anoComparativo}:`} value={compTotDesp} color={COMP_DESP} />
            </>)}
          </div>

          {/* ── Toggle comparativo ── */}
          <button
            type="button"
            onClick={() => {
              const next = !modoComparativo;
              if (next) setAnoBase(anoSelecionado);
              setModoComparativo(next);
            }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-medium
              transition-colors duration-200 border
              ${modoComparativo
                ? 'bg-primary-container/20 text-primary border-primary/30'
                : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container'
              }
            `}
            title={modoComparativo ? 'Desativar comparativo' : 'Ativar comparativo'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {modoComparativo ? 'compare' : 'compare_arrows'}
            </span>
            {modoComparativo ? 'Comparando' : 'Comparar'}
          </button>

          {/* ── Seletores de ano (modo comparativo) ── */}
          {modoComparativo && (
            <>
              {/* Ano base */}
              <div className="relative">
                <select
                  value={anoBase}
                  onChange={(e) => {
                    const novo = Number(e.target.value);
                    setAnoBase(novo);
                    if (anoComparativo === novo) {
                      const fallback = anos.find((a) => a !== novo) ?? novo - 1;
                      setAnoComparativo(fallback);
                    }
                  }}
                  className="
                    appearance-none bg-surface-container-low
                    rounded-lg px-3 py-1.5 pr-8 text-label-md font-medium text-on-surface
                    border border-border-default hover:border-border-hover
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    transition-colors duration-200
                  "
                >
                  {anos.map((ano) => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 14 }}>
                  expand_more
                </span>
              </div>

              <span className="text-label-md text-on-surface-variant">vs</span>

              {/* Ano comparativo */}
              <div className="relative">
                <select
                  value={anoComparativo}
                  onChange={(e) => setAnoComparativo(Number(e.target.value))}
                  className="
                    appearance-none bg-surface-container-low
                    rounded-lg px-3 py-1.5 pr-8 text-label-md font-medium text-on-surface
                    border border-border-default hover:border-border-hover
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    transition-colors duration-200
                  "
                >
                  {anos
                    .filter((a) => a !== anoBase)
                    .map((ano) => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: 14 }}>
                  expand_more
                </span>
              </div>
            </>
          )}

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
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-semibold" style={{ color }}>{formatCurrency(value, { compact: true })}</span>
    </div>
  );
}
