'use client';

import { formatCurrency } from '@/lib/utils';
import type { ConvenioItem, ConvenioMovimentacao } from '@/types/convenio';

import {
  ConvenioTipoBadge,
  ConvenioEsferaBadge,
  ConvenioSituacaoBadge,
} from './convenios-table';

/* ── Convenio Mobile Card ── */

function ConvenioMobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: ConvenioItem;
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
            {item.numero}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {item.concedente}
          </p>
        </div>
        <ConvenioTipoBadge tipo={item.tipo} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ConvenioEsferaBadge esfera={item.esfera} />
          <ConvenioSituacaoBadge situacao={item.situacao} />
        </div>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.valor)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Convenente:</span>{' '}
            {item.convenente}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Assinatura:</span>{' '}
            {item.assinatura}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Objeto:</span>{' '}
            {item.objeto}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Movimentacao Mobile Card ── */

function MovimentacaoMobileCard({
  item,
}: {
  item: ConvenioMovimentacao;
}) {
  return (
    <div className="bg-surface-container-lowest/50 rounded-xl p-4 hover:bg-surface-container transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-on-surface truncate">
            {item.convenio}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {item.lancamento}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-label-md font-medium shrink-0 ${
            item.tipo === 'receita'
              ? 'bg-[#22c55e18] text-[#22c55e]'
              : 'bg-[#f9731618] text-[#f97316]'
          }`}
        >
          {item.tipo === 'receita' ? 'Receita' : 'Despesa'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{item.data}</span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.valor)}
        </span>
      </div>
      <div className="mt-2 text-xs text-on-surface-variant">
        <span className="font-medium text-on-surface">Entidade:</span>{' '}
        {item.entidade}
      </div>
    </div>
  );
}

/* ── Convenio Mobile Card List ── */

interface ConvenioMobileCardsProps {
  items: ConvenioItem[];
  expandedNumero: string | null;
  onToggleExpand: (numero: string) => void;
}

export function ConvenioMobileCards({
  items,
  expandedNumero,
  onToggleExpand,
}: ConvenioMobileCardsProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient lg:hidden">
        <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
          search_off
        </span>
        <p className="text-on-surface-variant">Nenhum convenio encontrado</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 lg:hidden">
      {items.map((item, i) => (
        <ConvenioMobileCard
          key={`${item.numero}-${i}`}
          item={item}
          isExpanded={expandedNumero === item.numero}
          onToggle={() => onToggleExpand(item.numero)}
        />
      ))}
    </div>
  );
}

/* ── Movimentacao Mobile Card List ── */

interface MovimentacaoMobileCardsProps {
  items: ConvenioMovimentacao[];
}

export function MovimentacaoMobileCards({
  items,
}: MovimentacaoMobileCardsProps) {
  return (
    <div className="space-y-2 lg:hidden p-4">
      {items.map((mov, i) => (
        <MovimentacaoMobileCard
          key={`${mov.convenio}-${mov.lancamento}-${i}`}
          item={mov}
        />
      ))}
    </div>
  );
}
