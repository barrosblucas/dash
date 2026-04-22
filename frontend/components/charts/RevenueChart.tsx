'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';

import { formatCurrency } from '@/lib/utils';
import { CHART_CONFIG } from '@/lib/constants';
import apiClient from '@/services/api';
import { useDashboardFilters } from '@/stores/filtersStore';
import { useChartThemeColors } from '@/stores/themeStore';
import ChartTypeSelector, { ChartTypeOption } from '@/components/ui/ChartTypeSelector';

interface KPIsMensal {
  mes: number; ano: number; total_receitas: number; total_despesas: number; saldo: number;
}

interface KPIsResponse {
  periodo: string; receitas_total: number; despesas_total: number; saldo: number;
  percentual_execucao_receita: number | null; percentual_execucao_despesa: number | null;
  kpis_mensais: KPIsMensal[] | null;
  kpis_anuais: Array<{ ano: number; total_receitas: number; total_despesas: number; saldo: number }> | null;
}

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/** Paleta em tons de verde para PieChart (família revenue) */
const PIE_COLORS = ['#006c47','#00894a','#009651','#33ab72','#54b98b','#8acfae','#b0dfcb','#00532d','#004283','#33689c','#5481ad','#8aa9c7'];

const REVENUE_PRIMARY = '#006c47';

async function fetchMonthlyRevenue(ano: number): Promise<KPIsResponse> {
  return apiClient.get<KPIsResponse>(`/api/v1/kpis/mensal/${ano}`);
}

interface RevenueChartProps { height?: number; className?: string }

export default function RevenueChart({ height = 320, className = '' }: RevenueChartProps) {
  const { anoSelecionado, compararComAnoAnterior } = useDashboardFilters();
  const [chartType, setChartType] = useState<ChartTypeOption>('area');
  const chartColors = useChartThemeColors();
  const anoAnterior = anoSelecionado - 1;

  const { data: kpisResponse, isLoading, error } = useQuery({
    queryKey: ['kpis', 'mensal', 'receitas', anoSelecionado],
    queryFn: () => fetchMonthlyRevenue(anoSelecionado),
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  const { data: kpisAnterior } = useQuery({
    queryKey: ['kpis', 'mensal', 'receitas', anoAnterior],
    queryFn: () => fetchMonthlyRevenue(anoAnterior),
    enabled: compararComAnoAnterior,
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-title-md font-display text-on-surface">Receitas</h3>
          <p className="text-body-sm text-on-surface-variant">Carregando dados...</p>
        </div>
        <div className="animate-pulse" style={{ height }}>
          <div className="w-full h-full bg-surface-container-high/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !kpisResponse?.kpis_mensais) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="mb-4">
          <h3 className="text-title-md font-display text-on-surface">Receitas</h3>
          <p className="text-body-sm text-error">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const isCartesian = chartType !== 'pie';
  const totalAno = kpisResponse.kpis_mensais.reduce((s, k) => s + Number(k.total_receitas), 0);
  const mensais = kpisResponse.kpis_mensais;

  const cartesianData = mensais.map((kpi) => {
    const anterior = kpisAnterior?.kpis_mensais?.find((m) => m.mes === kpi.mes);
    return {
      mes: kpi.mes,
      name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
      receitas: Number(kpi.total_receitas),
      receitasAnterior: anterior ? Number(anterior.total_receitas) : undefined,
    };
  });

  const pieData = mensais.map((kpi) => ({
    mes: kpi.mes,
    name: MESES_ABREV[kpi.mes - 1] || `${kpi.mes}`,
    receitas: Number(kpi.total_receitas),
    percentual: totalAno > 0 ? (Number(kpi.total_receitas) / totalAno) * 100 : 0,
  }));

  const cartesianTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="text-label-md text-on-surface-variant mb-1.5 font-medium">{label}</p>
        <p className="text-body-sm font-semibold text-secondary">
          {`${anoSelecionado}: ${formatCurrency(payload[0].value as number)}`}
        </p>
        {compararComAnoAnterior && payload[1]?.value !== undefined && (
          <p className="text-label-md text-on-surface-variant">{`${anoAnterior}: ${formatCurrency(payload[1].value as number)}`}</p>
        )}
      </div>
    );
  };

  const pieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const d = (payload[0].payload as { name: string; receitas: number; percentual: number });
    return (
      <div className="custom-tooltip">
        <p className="text-label-md text-on-surface-variant mb-1.5 font-medium">{d.name}</p>
        <p className="text-body-sm font-semibold text-secondary">{formatCurrency(d.receitas)}</p>
        <p className="text-label-md text-on-surface-variant">{`${d.percentual.toFixed(1)}% do total`}</p>
      </div>
    );
  };

  const xAxis = <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartColors.textMuted, fontSize: 12 }} />;
  const yAxis = (
    <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.textMuted, fontSize: 12 }}
      tickFormatter={(v: number) => formatCurrency(v, { compact: true, showSymbol: false })} />
  );
  const grid = <CartesianGrid strokeDasharray="3 3" stroke={chartColors.borderDefault} vertical={false} />;
  const margin = CHART_CONFIG.defaults.margin;
  const dur = CHART_CONFIG.animation.duration;

  const pieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: {
    cx: number; cy: number; midAngle: number; outerRadius: number;
    innerRadius: number; percent: number; name: string;
  }) => {
    if (percent < 0.04) return null;
    const rad = Math.PI / 180;
    const r = outerRadius * 1.4;
    const x = cx + r * Math.cos(-midAngle * rad);
    const y = cy + r * Math.sin(-midAngle * rad);
    return (
      <text x={x} y={y} fill={chartColors.pieLabel} textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central" fontSize={11}>
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const gradientDefs = (
    <defs>
      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={REVENUE_PRIMARY} stopOpacity={0.3} />
        <stop offset="95%" stopColor={REVENUE_PRIMARY} stopOpacity={0} />
      </linearGradient>
      {compararComAnoAnterior && (
        <linearGradient id="colorRevenueAnterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={REVENUE_PRIMARY} stopOpacity={0.15} />
          <stop offset="95%" stopColor={REVENUE_PRIMARY} stopOpacity={0} />
        </linearGradient>
      )}
    </defs>
  );

  function renderChart() {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={cartesianData} margin={margin}>
              {gradientDefs}{grid}{xAxis}{yAxis}
              <Tooltip content={cartesianTooltip} />
              {compararComAnoAnterior && (
                <Bar dataKey="receitasAnterior" fill={REVENUE_PRIMARY} fillOpacity={0.2}
                  stroke={REVENUE_PRIMARY} strokeOpacity={0.3} strokeDasharray="5 5" animationDuration={dur} />
              )}
              <Bar dataKey="receitas" fill={REVENUE_PRIMARY} radius={[4,4,0,0]} animationDuration={dur} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={cartesianData} margin={margin}>
              {grid}{xAxis}{yAxis}
              <Tooltip content={cartesianTooltip} />
              {compararComAnoAnterior && (
                <Line type="monotone" dataKey="receitasAnterior" stroke={REVENUE_PRIMARY}
                  strokeOpacity={0.3} strokeDasharray="5 5" dot={false} animationDuration={dur} />
              )}
              <Line type="monotone" dataKey="receitas" stroke={REVENUE_PRIMARY} strokeWidth={2}
                dot={{ fill: REVENUE_PRIMARY, r: 3 }} activeDot={{ r: 5 }} animationDuration={dur} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                dataKey="receitas" nameKey="name" label={pieLabel} labelLine={false}
                animationDuration={dur}>
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${entry.mes}`} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={pieTooltip} />
              <Legend verticalAlign="bottom" height={36}
                formatter={(v: string) => <span className="text-label-md text-on-surface-variant">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={cartesianData} margin={margin}>
              {gradientDefs}{grid}{xAxis}{yAxis}
              <Tooltip content={cartesianTooltip} />
              {compararComAnoAnterior && (
                <Area type="monotone" dataKey="receitasAnterior" stroke={REVENUE_PRIMARY}
                  strokeOpacity={0.3} strokeDasharray="5 5" fillOpacity={1}
                  fill="url(#colorRevenueAnterior)" animationDuration={dur} />
              )}
              <Area type="monotone" dataKey="receitas" stroke={REVENUE_PRIMARY} strokeWidth={2}
                fillOpacity={1} fill="url(#colorRevenue)" animationDuration={dur} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  }

  return (
    <div className={`chart-container ${className}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-title-md font-display text-on-surface">Receitas</h3>
          <p className="text-body-sm text-on-surface-variant">Evolução mensal — {anoSelecionado}</p>
        </div>
        <div className="flex items-center gap-4">
          <ChartTypeSelector value={chartType} onChange={setChartType} />
          <div className="text-right hidden sm:block">
            <p className="text-label-md text-on-surface-variant">Total {anoSelecionado}</p>
            <p className="text-headline-sm font-display text-secondary">
              {formatCurrency(totalAno, { compact: true })}
            </p>
          </div>
        </div>
      </div>
      {renderChart()}
      {isCartesian && compararComAnoAnterior && (
        <div className="mt-4 flex items-center justify-center gap-6 text-label-md text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-secondary rounded" /><span>{anoSelecionado}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-secondary/40 rounded" style={{ borderStyle: 'dashed' }} />
            <span>{anoAnterior}</span>
          </div>
        </div>
      )}
    </div>
  );
}
