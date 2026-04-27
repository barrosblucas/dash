'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { ObraMedicao } from '@/types/obra';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COLOR_PLANEJADO = '#c4c6d1';
const COLOR_REALIZADO = '#006c47';

interface ObraProgressChartProps {
  progressoFisico: number | null;
  progressoFinanceiro: number | null;
  medicoes: ObraMedicao[];
  dataInicio: string | null;
  previsaoTermino: string | null;
}

interface ChartPoint {
  label: string;
  planejado: number;
  realizado: number;
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
  return (
    <div className="rounded-xl border border-outline/20 bg-surface-container-lowest/95 backdrop-blur-xl px-4 py-3 shadow-ambient">
      <p className="text-label-md font-medium text-on-surface mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: entry.color,
                borderStyle: entry.dataKey === 'planejado' ? 'dashed' : 'solid',
                borderWidth: 1,
                borderColor: entry.color,
              }}
            />
            <span className="text-body-sm text-on-surface-variant">{entry.name}:</span>
            <span className="text-body-sm font-semibold text-on-surface">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMonthLabel(m: ObraMedicao): string {
  const mes = MESES_ABREV[m.mes_referencia - 1] ?? `${m.mes_referencia}`;
  return `${mes} ${m.ano_referencia}`;
}

function buildChartData(
  medicoes: ObraMedicao[],
  dataInicio: string | null,
  previsaoTermino: string | null,
  progressoFisico: number | null,
  progressoFinanceiro: number | null,
): ChartPoint[] {
  const sorted = [...medicoes].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) return a.ano_referencia - b.ano_referencia;
    return a.mes_referencia - b.mes_referencia;
  });

  const startDate = dataInicio ? new Date(dataInicio) : null;
  const endDate = previsaoTermino ? new Date(previsaoTermino) : null;
  const totalDurationMs = startDate && endDate ? endDate.getTime() - startDate.getTime() : null;

  const cumulativeValues: number[] = [];
  let sum = 0;
  for (const m of sorted) {
    sum += m.valor_medicao;
    cumulativeValues.push(sum);
  }
  const totalDisbursed = sum;

  const finalProgress = progressoFisico ?? progressoFinanceiro ?? null;

  return sorted.map((m, i) => {
    // Planejado: percentual do tempo decorrido
    let planejado: number;
    if (totalDurationMs && totalDurationMs > 0 && startDate) {
      const medicaoDate = new Date(m.ano_referencia, m.mes_referencia - 1, 15);
      const elapsed = medicaoDate.getTime() - startDate.getTime();
      planejado = Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));
    } else {
      // Sem datas: progressão linear simples sobre os pontos de medição
      planejado = sorted.length > 1 ? (i / (sorted.length - 1)) * 100 : 0;
    }

    // Realizado: acumulado financeiro escalado ao progresso físico/financeiro final
    let realizado: number;
    if (finalProgress !== null && totalDisbursed > 0) {
      realizado = (cumulativeValues[i] / totalDisbursed) * finalProgress;
    } else if (totalDisbursed > 0) {
      // Sem progresso informado: mostrar % do desembolso acumulado
      realizado = (cumulativeValues[i] / totalDisbursed) * 100;
    } else {
      realizado = 0;
    }

    return {
      label: formatMonthLabel(m),
      planejado,
      realizado,
    };
  });
}

export default function ObraProgressChart({
  progressoFisico,
  progressoFinanceiro,
  medicoes,
  dataInicio,
  previsaoTermino,
}: ObraProgressChartProps) {
  const hasData = medicoes.length >= 2;

  if (!hasData) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-8">
        <div className="mb-6">
          <h3 className="text-title-md font-display text-on-surface">Avanço Físico / Financeiro</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Evolução planejada vs realizada</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px] mb-3">timeline</span>
          <p className="text-on-surface-variant font-medium mb-1">Dados insuficientes para exibir evolução</p>
          <p className="text-sm text-on-surface-variant/60">É necessário pelo menos duas medições</p>
        </div>
      </div>
    );
  }

  const data = buildChartData(medicoes, dataInicio, previsaoTermino, progressoFisico, progressoFinanceiro);

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-8">
      <div className="mb-6">
        <h3 className="text-title-md font-display text-on-surface">Avanço Físico / Financeiro</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">Evolução planejada vs realizada</p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e3eb" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="planejado"
              name="Planejado"
              stroke={COLOR_PLANEJADO}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, fill: COLOR_PLANEJADO }}
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey="realizado"
              name="Realizado"
              stroke={COLOR_REALIZADO}
              strokeWidth={2.5}
              dot={{ fill: COLOR_REALIZADO, r: 3 }}
              activeDot={{ r: 5, fill: COLOR_REALIZADO }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-label-md text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5 flex-shrink-0"
            style={{ borderTop: `2px dashed ${COLOR_PLANEJADO}` }}
          />
          <span>Planejado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-[#006c47] flex-shrink-0 rounded-full" />
          <span>Realizado</span>
        </div>
      </div>
    </div>
  );
}
