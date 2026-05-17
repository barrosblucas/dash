'use client';

import type { EmendaItem } from '@/types/emenda';
import { formatCurrency } from '@/lib/utils';
import { EmendaTipoBadge } from './emendas-table';

/* ── Single mobile card ── */

function EmendaMobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: EmendaItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-surface-container-lowest/50 rounded-xl p-4 hover:bg-surface-container transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-on-surface truncate">{item.emenda}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {item.numero_protocolo}
          </p>
        </div>
        <EmendaTipoBadge tipo={item.tipo_emenda} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{item.ano}</span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.valor)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Descricao:</span> {item.descricao}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Mobile card list ── */

interface EmendasMobileCardsProps {
  items: EmendaItem[];
  expandedEmenda: string | null;
  onToggle: (emenda: string) => void;
}

export default function EmendasMobileCards({
  items,
  expandedEmenda,
  onToggle,
}: EmendasMobileCardsProps) {
  return (
    <div className="space-y-2 lg:hidden">
      {items.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient">
          <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
            search_off
          </span>
          <p className="text-on-surface-variant">Nenhuma emenda encontrada</p>
        </div>
      ) : (
        items.map((item, i) => (
          <EmendaMobileCard
            key={`${item.emenda}-${i}`}
            item={item}
            isExpanded={expandedEmenda === item.emenda}
            onToggle={() => onToggle(item.emenda)}
          />
        ))
      )}
    </div>
  );
}
