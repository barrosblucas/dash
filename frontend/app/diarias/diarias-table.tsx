'use client';

import { formatCurrency } from '@/lib/utils';
import type { DiariaItem } from '@/types/diaria';
import type { SortField, SortDir } from './diarias-hooks';

/* ── Th sortable header ── */

interface ThProps {
  sortField: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (field: SortField) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

function Th({ sortField, current, dir, onClick, children, align = 'left' }: ThProps) {
  return (
    <th
      className={`py-3 px-4 cursor-pointer hover:text-on-surface transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onClick(sortField)}
    >
      {children} {current === sortField && (dir === 'asc' ? ' ↑' : ' ↓')}
    </th>
  );
}

/* ── Expandable table row ── */

interface DiariaTableRowProps {
  item: DiariaItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function DiariaTableRow({ item, isExpanded, onToggle }: DiariaTableRowProps) {
  return (
    <>
      <tr
        className="hover:bg-surface-container transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.numero_empenho}</span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.numero_liquidacao}</span>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <span className="text-sm text-on-surface font-medium max-w-[220px] truncate block">
              {item.nome}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[180px] truncate block">
            {item.destino}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.periodo}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.valor_total)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface-variant">
            {item.valor_devolvido > 0
              ? formatCurrency(item.valor_devolvido)
              : '—'}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-col gap-2 text-xs text-on-surface-variant">
              <div className="flex items-center gap-6 flex-wrap">
                <span>
                  <span className="font-medium text-on-surface">Emp:</span> {item.numero_empenho}
                </span>
                <span>
                  <span className="font-medium text-on-surface">Liq:</span> {item.numero_liquidacao}
                </span>
                <span>
                  <span className="font-medium text-on-surface">Ano:</span> {item.ano}
                </span>
                <span>
                  <span className="font-medium text-on-surface">Mês:</span> {item.mes}
                </span>
              </div>
              {item.historico && (
                <p className="leading-relaxed">
                  <span className="font-medium text-on-surface">Histórico:</span> {item.historico}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Desktop table component ── */

interface DiariasTableProps {
  filteredItems: DiariaItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedIndex: number | null;
  onToggleExpand: (index: number) => void;
}

export default function DiariasTable({
  filteredItems,
  sortField,
  sortDir,
  onSort,
  expandedIndex,
  onToggleExpand,
}: DiariasTableProps) {
  if (filteredItems.length === 0) return null;

  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <th className="py-3 px-4 text-left">Emp</th>
            <th className="py-3 px-4 text-left">Liq</th>
            <Th sortField="nome" current={sortField} dir={sortDir} onClick={onSort}>
              Nome
            </Th>
            <Th sortField="destino" current={sortField} dir={sortDir} onClick={onSort}>
              Destino
            </Th>
            <Th sortField="periodo" current={sortField} dir={sortDir} onClick={onSort}>
              Período
            </Th>
            <Th sortField="valor_total" current={sortField} dir={sortDir} onClick={onSort} align="right">
              Valor Total
            </Th>
            <Th sortField="valor_devolvido" current={sortField} dir={sortDir} onClick={onSort} align="right">
              Valor Devolvido
            </Th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, i) => (
            <DiariaTableRow
              key={`${item.numero_empenho}-${item.numero_liquidacao}-${i}`}
              item={item}
              isExpanded={expandedIndex === i}
              onToggle={() => onToggleExpand(i)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Th, DiariaTableRow };
