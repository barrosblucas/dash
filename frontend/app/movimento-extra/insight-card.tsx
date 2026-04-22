'use client';

import { useState } from 'react';

import { formatCurrency } from '@/lib/utils';
import type { InsightItem } from '@/types/movimento-extra';

export function InsightCard({
  insight,
  accentColor,
  rank,
}: {
  insight: InsightItem;
  accentColor: string;
  rank: number;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      className="bg-surface-container-low dark:bg-slate-800/30 rounded-xl p-4 transition-all duration-200 hover:shadow-ambient"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {rank}
          </span>
          <h4 className="text-sm font-semibold text-on-surface dark:text-slate-200">
            {insight.categoria}
          </h4>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTip(!showTip)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Explicação"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
          </button>
          {showTip && (
            <div className="absolute right-0 top-7 z-20 w-56 rounded-xl bg-surface-container-highest dark:bg-slate-700 p-3 shadow-ambient-lg">
              <p className="text-xs text-on-surface-variant">{insight.descricao}</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-lg font-bold text-on-surface dark:text-white mb-1">
        {formatCurrency(insight.valor)}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-on-surface-variant/60">{insight.quantidade} itens</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {insight.percentual.toFixed(1)}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-surface-container-high dark:bg-slate-700/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(insight.percentual, 100)}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    </div>
  );
}
