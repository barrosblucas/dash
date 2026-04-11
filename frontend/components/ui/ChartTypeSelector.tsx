'use client';

import { useState } from 'react';

/**
 * Tipos de gráfico suportados pelo dashboard
 */
export type ChartTypeOption = 'bar' | 'line' | 'area' | 'pie';

interface ChartTypeSelectorProps {
  /** Tipo atualmente selecionado */
  value: ChartTypeOption;
  /** Callback quando o usuário muda o tipo */
  onChange: (type: ChartTypeOption) => void;
  /** Tipos disponíveis para seleção (default: todos) */
  availableTypes?: ChartTypeOption[];
}

/** Ícones SVG inline para cada tipo de gráfico */
const CHART_ICONS: Record<ChartTypeOption, JSX.Element> = {
  bar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6" y="4" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" opacity="0.85" />
    </svg>
  ),
  line: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12L5 6L9 9L15 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  area: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12L5 6L9 9L15 2V14H1V12Z" fill="currentColor" opacity="0.3" />
      <path d="M1 12L5 6L9 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pie: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8H8V1.5Z" fill="currentColor" opacity="0.7" />
      <path d="M8 8L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const CHART_LABELS: Record<ChartTypeOption, string> = {
  bar: 'Barras',
  line: 'Linha',
  area: 'Área',
  pie: 'Pizza',
};

export default function ChartTypeSelector({
  value,
  onChange,
  availableTypes = ['bar', 'line', 'area', 'pie'],
}: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-dark-800/60 p-1">
      {availableTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          title={CHART_LABELS[type]}
          className={`
            flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5
            text-xs font-medium transition-all duration-200
            ${
              value === type
                ? 'bg-dark-600 text-dark-100 shadow-sm ring-1 ring-dark-500'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
            }
          `}
        >
          <span className="flex-shrink-0">{CHART_ICONS[type]}</span>
          <span className="hidden sm:inline">{CHART_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}
