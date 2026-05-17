'use client';

import type { ContratoItem } from '@/types/contrato';
import { formatCurrency } from '@/lib/utils';
import type { SortField, SortDir } from './contratos-hooks';

/* ── Shared badge (also used by mobile cards) ── */

export function ContratoTipoBadge({ tipo }: { tipo: string }) {
  const isPrincipal = tipo === 'Principal';
  return (
    <span
      className={[
        'rounded-full px-2.5 py-0.5 text-label-md font-medium',
        isPrincipal
          ? 'bg-secondary/10 text-secondary dark:bg-secondary/10'
          : 'bg-[#f9731618] text-[#f97316]',
      ].join(' ')}
    >
      {tipo}
    </span>
  );
}

/* ── Helpers ── */

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
      {children}
      {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

interface RowProps {
  item: ContratoItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function ContratoTableRow({ item, isExpanded, onToggle }: RowProps) {
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
            <span className="text-sm text-on-surface font-medium">{item.numero}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[220px] truncate block">
            {item.fornecedor}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.cpf_cnpj}</span>
        </td>
        <td className="py-3 px-4">
          <ContratoTipoBadge tipo={item.tipo} />
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.vigencia}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.valor)}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              <span>
                <span className="font-medium text-on-surface">CPF/CNPJ:</span> {item.cpf_cnpj}
              </span>
              <span>
                <span className="font-medium text-on-surface">Vigencia:</span> {item.vigencia}
              </span>
              <span>
                <span className="font-medium text-on-surface">Ano:</span> {item.ano}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Main export ── */

interface ContratosTableProps {
  items: ContratoItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedNumero: string | null;
  onToggleExpand: (numero: string) => void;
}

export default function ContratosTable({
  items,
  sortField,
  sortDir,
  onSort,
  expandedNumero,
  onToggleExpand,
}: ContratosTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th sortField="numero" current={sortField} dir={sortDir} onClick={onSort}>
              Contrato
            </Th>
            <Th sortField="fornecedor" current={sortField} dir={sortDir} onClick={onSort}>
              Fornecedor
            </Th>
            <Th sortField="cpf_cnpj" current={sortField} dir={sortDir} onClick={onSort}>
              CPF/CNPJ
            </Th>
            <Th sortField="tipo" current={sortField} dir={sortDir} onClick={onSort}>
              Tipo
            </Th>
            <Th sortField="vigencia" current={sortField} dir={sortDir} onClick={onSort}>
              Vigencia
            </Th>
            <Th
              sortField="valor"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Valor
            </Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <ContratoTableRow
              key={`${item.numero}-${i}`}
              item={item}
              isExpanded={expandedNumero === item.numero}
              onToggle={() => onToggleExpand(item.numero)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
