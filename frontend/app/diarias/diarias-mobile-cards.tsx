'use client';

import { formatCurrency } from '@/lib/utils';
import type { DiariaItem } from '@/types/diaria';

interface DiariaMobileCardProps {
  item: DiariaItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function DiariaMobileCard({ item, isExpanded, onToggle }: DiariaMobileCardProps) {
  return (
    <div
      className="bg-surface-container-lowest/50 rounded-xl p-4 hover:bg-surface-container transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-on-surface truncate">
            {item.nome}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.destino}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{item.periodo}</span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.valor_total)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Emp:</span> {item.numero_empenho}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Liq:</span> {item.numero_liquidacao}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Valor Devolvido:</span>{' '}
            {formatCurrency(item.valor_devolvido)}
          </p>
          {item.historico && (
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              <span className="font-medium text-on-surface">Histórico:</span> {item.historico}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mobile cards list component ── */

interface DiariasMobileCardsProps {
  filteredItems: DiariaItem[];
  expandedIndex: number | null;
  onToggleExpand: (index: number) => void;
}

export default function DiariasMobileCards({
  filteredItems,
  expandedIndex,
  onToggleExpand,
}: DiariasMobileCardsProps) {
  if (filteredItems.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient lg:hidden">
        <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">search_off</span>
        <p className="text-on-surface-variant">Nenhum registro encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:hidden">
      {filteredItems.map((item, i) => (
        <DiariaMobileCard
          key={`${item.numero_empenho}-${item.numero_liquidacao}-${i}`}
          item={item}
          isExpanded={expandedIndex === i}
          onToggle={() => onToggleExpand(i)}
        />
      ))}
    </div>
  );
}
