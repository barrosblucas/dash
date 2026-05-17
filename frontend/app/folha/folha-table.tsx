'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import type { FolhaEmployeeItem } from '@/types/folha';
import type { SortField, SortDir } from './folha-hooks';

/* ── Sortable table header ── */

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
      {children} {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

/* ── Expandable employee table row ── */

function EmployeeTableRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: FolhaEmployeeItem;
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
            <span className="text-sm text-on-surface font-medium">{item.contract}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface max-w-[200px] truncate block">
            {item.name}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.cpf}</span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[200px] truncate block">
            {item.role}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[180px] truncate block">
            {item.office_description}
            {item.department_description && ` / ${item.department_description}`}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface">{formatCurrency(item.gross_salary)}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.net_salary)}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs text-on-surface-variant">
              <div>
                <span className="font-medium text-on-surface">CPF:</span> {item.cpf}
              </div>
              <div>
                <span className="font-medium text-on-surface">Situacao:</span> {item.state}
              </div>
              <div>
                <span className="font-medium text-on-surface">Classe/Nivel:</span>{' '}
                {item.class_and_level}
              </div>
              <div>
                <span className="font-medium text-on-surface">Admissao:</span>{' '}
                {formatDate(item.admission_date)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Desligamento:</span>{' '}
                {item.end_date ? formatDate(item.end_date) : '-'}
              </div>
              <div>
                <span className="font-medium text-on-surface">Salario Base:</span>{' '}
                {formatCurrency(item.base_salary)}
              </div>
              <div>
                <span className="font-medium text-on-surface">13° Salario:</span>{' '}
                {formatCurrency(item.tenth_salary)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Ferias:</span>{' '}
                {formatCurrency(item.vacation)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Gratificacao:</span>{' '}
                {formatCurrency(item.gratification)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Outros:</span>{' '}
                {formatCurrency(item.others_earnings)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Descontos:</span>{' '}
                <span className="text-[#f97316]">{formatCurrency(item.discounts)}</span>
              </div>
              <div>
                <span className="font-medium text-on-surface">Bruto:</span>{' '}
                {formatCurrency(item.gross_salary)}
              </div>
              <div>
                <span className="font-medium text-on-surface">Liquido:</span>{' '}
                {formatCurrency(item.net_salary)}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Desktop table ── */

interface FolhaTableProps {
  items: FolhaEmployeeItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedContract: string | null;
  onToggleExpand: (contract: string) => void;
}

export function FolhaTable({
  items,
  sortField,
  sortDir,
  onSort,
  expandedContract,
  onToggleExpand,
}: FolhaTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th sortField="contract" current={sortField} dir={sortDir} onClick={onSort}>
              Matricula
            </Th>
            <Th sortField="name" current={sortField} dir={sortDir} onClick={onSort}>
              Nome
            </Th>
            <Th sortField="cpf" current={sortField} dir={sortDir} onClick={onSort}>
              CPF
            </Th>
            <Th sortField="role" current={sortField} dir={sortDir} onClick={onSort}>
              Cargo
            </Th>
            <Th
              sortField="office_description"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Orgao
            </Th>
            <Th
              sortField="gross_salary"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Bruto
            </Th>
            <Th
              sortField="net_salary"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Liquido
            </Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <EmployeeTableRow
              key={`${item.contract}-${i}`}
              item={item}
              isExpanded={expandedContract === item.contract}
              onToggle={() => onToggleExpand(item.contract)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
