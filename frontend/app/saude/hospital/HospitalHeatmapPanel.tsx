'use client';

import { SaudeUnavailablePanel } from '@/components/saude/SaudePageSection';
import type { SaudeHospitalHeatmap } from '@/types/saude';

interface HospitalHeatmapPanelProps {
  heatmap: SaudeHospitalHeatmap | null;
}

const cellColor = (value: number, maxValue: number) => {
  if (maxValue <= 0) {
    return 'rgba(255, 244, 170, 0.5)';
  }
  const intensity = Math.max(0.18, value / maxValue);
  return `rgba(234, 120, 44, ${Math.min(0.88, intensity)})`;
};

export default function HospitalHeatmapPanel({ heatmap }: HospitalHeatmapPanelProps) {
  if (!heatmap) {
    return (
      <SaudeUnavailablePanel
        title="Mapa de calor indisponível"
        description="A origem pública não retornou a matriz de atendimentos por hora e dia."
      />
    );
  }

  const maxValue = Math.max(...heatmap.totais_hora, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
        <div />
        {heatmap.horas.map((hour) => (
          <div key={hour} className="text-center">
            {hour}
          </div>
        ))}
        <div className="text-center">Total</div>
      </div>

      <div className="space-y-1">
        {heatmap.dias.map((day, rowIndex) => (
          <div key={`${day}-${rowIndex}`} className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1">
            <div className="flex items-center justify-center text-sm font-semibold text-on-surface-variant">{day}</div>
            {heatmap.matriz[rowIndex].map((value, columnIndex) => (
              <div
                key={`${day}-${heatmap.horas[columnIndex]}`}
                className="flex h-8 items-center justify-center rounded-md text-xs font-semibold text-slate-900"
                style={{ background: cellColor(value, maxValue) }}
              >
                {value}
              </div>
            ))}
            <div className="flex items-center justify-center rounded-md bg-surface-container-lowest text-sm font-semibold text-on-surface">
              {heatmap.totais_dia[rowIndex] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1">
        <div />
        {heatmap.totais_hora.map((value, index) => (
          <div
            key={`total-${heatmap.horas[index]}`}
            className="flex h-8 items-center justify-center rounded-md bg-surface-container-lowest text-sm font-semibold text-on-surface"
          >
            {value}
          </div>
        ))}
        <div className="flex items-center justify-center rounded-md bg-surface-container-high text-sm font-semibold text-on-surface">
          {heatmap.total_geral}
        </div>
      </div>
    </div>
  );
}
