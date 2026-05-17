'use client';

import type { EmendaItem } from '@/types/emenda';
import { formatCurrency } from '@/lib/utils';
import { tipoColor, tipoBg } from './emendas-hooks';
import type { SortField, SortDir } from './emendas-hooks';

/* ── Shared badge (also used by mobile cards) ── */

export function EmendaTipoBadge({ tipo }: { tipo: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-label-md font-medium"
      style={{
        backgroundColor: tipoBg(tipo),
        color: tipoColor(tipo),
      }}
    >
      {tipo}
    </span>
  );
}

/* ── Table header cell ── */

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
      className={`py-3 px-4 cursor-pointer hover:text-on-surface transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onClick(sortField)}
    >
      {children} {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

/* ── Table row ── */

function EmendaTableRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: EmendaItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-surface-container transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <span className="text-sm text-on-surface font-medium">{item.emenda}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <EmendaTipoBadge tipo={item.tipo_emenda} />
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.numero_protocolo}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.valor)}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={4} className="px-4 py-3">
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              <span>
                <span className="font-medium text-on-surface">Ano:</span> {item.ano}
              </span>
              <span>
                <span className="font-medium text-on-surface">Protocolo:</span>{' '}
                {item.numero_protocolo}
              </span>
              <span>
                <span className="font-medium text-on-surface">Descricao:</span>{' '}
                {item.descricao}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Desktop table ── */

interface EmendasTableProps {
  items: EmendaItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedEmenda: string | null;
  onToggle: (emenda: string) => void;
}

export default function EmendasTable({
  items,
  sortField,
  sortDir,
  onSort,
  expandedEmenda,
  onToggle,
}: EmendasTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th sortField="emenda" current={sortField} dir={sortDir} onClick={onSort}>
              Emenda
            </Th>
            <Th sortField="tipo_emenda" current={sortField} dir={sortDir} onClick={onSort}>
              Tipo
            </Th>
            <Th sortField="numero_protocolo" current={sortField} dir={sortDir} onClick={onSort}>
              Protocolo
            </Th>
            <Th sortField="valor" current={sortField} dir={sortDir} onClick={onSort} align="right">
              Valor
            </Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <EmendaTableRow
              key={`${item.emenda}-${i}`}
              item={item}
              isExpanded={expandedEmenda === item.emenda}
              onToggle={() => onToggle(item.emenda)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
