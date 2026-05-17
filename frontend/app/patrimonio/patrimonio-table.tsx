'use client';

import { formatCurrency } from '@/lib/utils';
import type { PatrimonioItem } from '@/types/patrimonio';
import { TIPO_COLORS } from './patrimonio-hooks';
import type { SortField, SortDir } from './patrimonio-hooks';

/* ── Types ── */

interface ThProps {
  sortField: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (field: SortField) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

/* ── Th ── */

function Th({ sortField, current, dir, onClick, children, align = 'left' }: ThProps) {
  return (
    <th
      className={`py-3 px-4 cursor-pointer hover:text-on-surface transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onClick(sortField)}
    >
      {children}{' '}
      {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

/* ── Tipo Badge ── */

export function PatrimonioTipoBadge({ tipo }: { tipo: string }) {
  const colors = TIPO_COLORS[tipo] ?? { bg: '#6b728018', text: '#6b7280' };
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-label-md font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {tipo}
    </span>
  );
}

/* ── Group Header Row ── */

function PatrimonioGroupHeader({
  tipo,
  count,
}: {
  tipo: string;
  count: number;
}) {
  return (
    <tr className="bg-surface-container/60">
      <td colSpan={10} className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <PatrimonioTipoBadge tipo={tipo} />
          <span className="text-label-md text-on-surface-variant">
            {count} item(ns)
          </span>
        </div>
      </td>
    </tr>
  );
}

/* ── Data Row ── */

function PatrimonioTableRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: PatrimonioItem;
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
            <PatrimonioTipoBadge tipo={item.tipo_bem} />
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface font-medium">
            {item.descricao}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface-variant">
            {item.quantidade_anterior}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface-variant">
            {formatCurrency(item.valor_anterior)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface">
            {item.quantidade_adquiridos}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface-variant">
            {formatCurrency(item.valor_adquiridos)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-[#f97316]">
            {item.quantidade_baixados}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface-variant">
            {formatCurrency(item.valor_baixados)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {item.quantidade_atual}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.valor_atual)}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={10} className="px-4 py-3">
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              <span>
                <span className="font-medium text-on-surface">Ano:</span>{' '}
                {item.ano}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Group Rows (header + items) ── */

function PatrimonioGroupRows({
  tipo,
  items,
  expandedDescricao,
  onToggle,
}: {
  tipo: string;
  items: PatrimonioItem[];
  expandedDescricao: string | null;
  onToggle: (descricao: string) => void;
}) {
  return (
    <>
      <PatrimonioGroupHeader tipo={tipo} count={items.length} />
      {items.map((item, i) => (
        <PatrimonioTableRow
          key={`${item.descricao}-${i}`}
          item={item}
          isExpanded={expandedDescricao === item.descricao}
          onToggle={() => onToggle(item.descricao)}
        />
      ))}
    </>
  );
}

/* ── Main Table ── */

export default function PatrimonioTable({
  sortedGroups,
  expandedDescricao,
  sortField,
  sortDir,
  onSort,
  onToggle,
}: {
  sortedGroups: [string, PatrimonioItem[]][];
  expandedDescricao: string | null;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onToggle: (descricao: string) => void;
}) {
  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th
              sortField="tipo_bem"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Tipo
            </Th>
            <Th
              sortField="descricao"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Descricao
            </Th>
            <Th
              sortField="quantidade_anterior"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Qtd Anterior
            </Th>
            <Th
              sortField="valor_anterior"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Valor Anterior
            </Th>
            <Th
              sortField="quantidade_adquiridos"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Adquiridos
            </Th>
            <Th
              sortField="valor_adquiridos"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Valor Adq.
            </Th>
            <Th
              sortField="quantidade_baixados"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Baixados
            </Th>
            <Th
              sortField="valor_baixados"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Valor Baix.
            </Th>
            <Th
              sortField="quantidade_atual"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Qtd Atual
            </Th>
            <Th
              sortField="valor_atual"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Valor Atual
            </Th>
          </tr>
        </thead>
        <tbody>
          {sortedGroups.map(([tipo, items]) => (
            <PatrimonioGroupRows
              key={tipo}
              tipo={tipo}
              items={items}
              expandedDescricao={expandedDescricao}
              onToggle={onToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
