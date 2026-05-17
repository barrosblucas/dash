'use client';

import { formatCurrency } from '@/lib/utils';
import type { PatrimonioItem } from '@/types/patrimonio';
import { PatrimonioTipoBadge } from './patrimonio-table';

/* ── Individual Card ── */

function PatrimonioMobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: PatrimonioItem;
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
          <p className="text-sm font-medium text-on-surface truncate">
            {item.descricao}
          </p>
        </div>
        <PatrimonioTipoBadge tipo={item.tipo_bem} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-on-surface-variant">
        <span>
          Qtd:{' '}
          <strong className="text-on-surface">
            {item.quantidade_atual}
          </strong>
        </span>
        <span className="text-right">
          Valor:{' '}
          <strong className="text-on-surface">
            {formatCurrency(item.valor_atual)}
          </strong>
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-on-surface-variant">
              Qtd Anterior:{' '}
              <span className="text-on-surface">
                {item.quantidade_anterior}
              </span>
            </span>
            <span className="text-on-surface-variant text-right">
              Valor Ant.:{' '}
              <span className="text-on-surface">
                {formatCurrency(item.valor_anterior)}
              </span>
            </span>
            <span className="text-on-surface-variant">
              Adquiridos:{' '}
              <span className="text-on-surface">
                {item.quantidade_adquiridos}
              </span>
            </span>
            <span className="text-on-surface-variant text-right">
              Valor Adq.:{' '}
              <span className="text-on-surface">
                {formatCurrency(item.valor_adquiridos)}
              </span>
            </span>
            <span className="text-on-surface-variant">
              Baixados:{' '}
              <span className="text-on-surface">
                {item.quantidade_baixados}
              </span>
            </span>
            <span className="text-on-surface-variant text-right">
              Valor Baix.:{' '}
              <span className="text-on-surface">
                {formatCurrency(item.valor_baixados)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Card List / Empty State ── */

export default function PatrimonioMobileCards({
  sortedGroups,
  expandedDescricao,
  onToggle,
}: {
  sortedGroups: [string, PatrimonioItem[]][];
  expandedDescricao: string | null;
  onToggle: (descricao: string) => void;
}) {
  if (sortedGroups.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient lg:hidden">
        <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
          search_off
        </span>
        <p className="text-on-surface-variant">Nenhum bem encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:hidden">
      {sortedGroups.map(([tipo, items]) => (
        <div key={tipo}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <PatrimonioTipoBadge tipo={tipo} />
            <span className="text-label-md text-on-surface-variant">
              {items.length} item(ns)
            </span>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <PatrimonioMobileCard
                key={`${item.descricao}-${i}`}
                item={item}
                isExpanded={expandedDescricao === item.descricao}
                onToggle={() => onToggle(item.descricao)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
