'use client';

import { SaudeUnavailablePanel } from '@/components/saude/SaudePageSection';
import type { SaudeHospitalHeatmap } from '@/types/saude';

interface HospitalHeatmapPanelProps {
  heatmap: SaudeHospitalHeatmap | null;
}

const cellColor = (value: number, maxValue: number) => {
  if (maxValue <= 0) {
    return 'rgba(255, 248, 225, 0.6)';
  }
  const intensity = value / maxValue;

  // Escala multi-stop: amarelo claro → laranja → vermelho intenso
  if (intensity <= 0.25) {
    const t = intensity / 0.25;
    const r = Math.round(254 + t * (255 - 254));
    const g = Math.round(237 + t * (170 - 237));
    const b = Math.round(180 + t * (90 - 180));
    return `rgb(${r},${g},${b})`;
  }
  if (intensity <= 0.5) {
    const t = (intensity - 0.25) / 0.25;
    const r = Math.round(255 - t * (255 - 244));
    const g = Math.round(170 - t * (170 - 109));
    const b = Math.round(90 - t * (90 - 44));
    return `rgb(${r},${g},${b})`;
  }
  if (intensity <= 0.75) {
    const t = (intensity - 0.5) / 0.25;
    const r = Math.round(244 - t * (244 - 202));
    const g = Math.round(109 - t * (109 - 0));
    const b = Math.round(44 - t * (44 - 32));
    return `rgb(${r},${g},${b})`;
  }
  const t = Math.min(1, (intensity - 0.75) / 0.25);
  const r = Math.round(202 - t * (202 - 140));
  const g = Math.round(0 + t * (0 - 0));
  const b = Math.round(32 + t * (66 - 32));
  return `rgb(${r},${g},${b})`;
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
            {heatmap.matriz[rowIndex].map((value, columnIndex) => {
              const intensity = maxValue > 0 ? value / maxValue : 0;
              const isDark = intensity > 0.5;
              return (
                <div
                  key={`${day}-${heatmap.horas[columnIndex]}`}
                  className={
                    `flex h-8 items-center justify-center rounded-md text-xs font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`
                  }
                  style={{ background: cellColor(value, maxValue) }}
                >
                  {value}
                </div>
              );
            })}
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
