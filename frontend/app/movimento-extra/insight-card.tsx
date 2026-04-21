'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

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
    <div className="relative rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4 hover:border-dark-600/60 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {rank}
          </span>
          <h4 className="text-sm font-semibold text-dark-200">{insight.categoria}</h4>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTip(!showTip)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-dark-500 hover:text-dark-300 transition-colors"
            aria-label="Explicação"
          >
            <Info className="w-3 h-3" />
          </button>
          {showTip && (
            <div className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-dark-700/60 bg-dark-900 p-3 shadow-xl">
              <p className="text-xs text-dark-300">{insight.descricao}</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-lg font-bold text-dark-100 mb-1">
        {formatCurrency(insight.valor)}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-500">{insight.quantidade} itens</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {insight.percentual.toFixed(1)}%
        </span>
      </div>
      {/* Barra visual de percentual */}
      <div className="mt-2 h-1.5 rounded-full bg-dark-700/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(insight.percentual, 100)}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}
