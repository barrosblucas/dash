'use client';

import type { ContratoItem } from '@/types/contrato';
import { formatCurrency } from '@/lib/utils';
import { ContratoTipoBadge } from './contratos-table';

interface ContratosMobileCardsProps {
  items: ContratoItem[];
  expandedNumero: string | null;
  onToggleExpand: (numero: string) => void;
}

function MobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: ContratoItem;
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
          <p className="text-sm font-medium text-on-surface truncate">{item.numero}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.fornecedor}</p>
        </div>
        <ContratoTipoBadge tipo={item.tipo} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{item.vigencia}</span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.valor)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">CPF/CNPJ:</span> {item.cpf_cnpj}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ContratosMobileCards({
  items,
  expandedNumero,
  onToggleExpand,
}: ContratosMobileCardsProps) {
  if (items.length === 0) {
    return (
      <div className="lg:hidden space-y-2">
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient">
          <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
            search_off
          </span>
          <p className="text-on-surface-variant">Nenhum contrato encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:hidden">
      {items.map((item, i) => (
        <MobileCard
          key={`${item.numero}-${i}`}
          item={item}
          isExpanded={expandedNumero === item.numero}
          onToggle={() => onToggleExpand(item.numero)}
        />
      ))}
    </div>
  );
}
