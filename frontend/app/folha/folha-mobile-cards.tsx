'use client';

import { formatCurrency } from '@/lib/utils';
import type { FolhaEmployeeItem } from '@/types/folha';

/* ── Mobile employee card ── */

function EmployeeMobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: FolhaEmployeeItem;
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
          <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">{item.contract}</span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.net_salary)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">CPF:</span> {item.cpf}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Orgao:</span>{' '}
            {item.office_description}
          </p>
          {item.department_description && (
            <p className="text-xs text-on-surface-variant">
              <span className="font-medium text-on-surface">Departamento:</span>{' '}
              {item.department_description}
            </p>
          )}
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Classe/Nivel:</span>{' '}
            {item.class_and_level}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Salario Base:</span>{' '}
            {formatCurrency(item.base_salary)}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">13° Salario:</span>{' '}
            {formatCurrency(item.tenth_salary)}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Ferias:</span>{' '}
            {formatCurrency(item.vacation)}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Gratificacao:</span>{' '}
            {formatCurrency(item.gratification)}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Outros:</span>{' '}
            {formatCurrency(item.others_earnings)}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Descontos:</span>{' '}
            <span className="text-[#f97316]">{formatCurrency(item.discounts)}</span>
          </p>
          <div className="pt-1 border-t border-outline/10 flex justify-between">
            <span className="text-xs font-medium text-on-surface">Bruto</span>
            <span className="text-xs font-semibold text-on-surface">
              {formatCurrency(item.gross_salary)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-medium text-on-surface">Liquido</span>
            <span className="text-xs font-semibold text-secondary">
              {formatCurrency(item.net_salary)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile card list ── */

interface FolhaMobileCardsProps {
  items: FolhaEmployeeItem[];
  expandedContract: string | null;
  onToggleExpand: (contract: string) => void;
}

export function FolhaMobileCards({
  items,
  expandedContract,
  onToggleExpand,
}: FolhaMobileCardsProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient lg:hidden">
        <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
          search_off
        </span>
        <p className="text-on-surface-variant">Nenhum servidor encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:hidden">
      {items.map((item, i) => (
        <EmployeeMobileCard
          key={`${item.contract}-${i}`}
          item={item}
          isExpanded={expandedContract === item.contract}
          onToggle={() => onToggleExpand(item.contract)}
        />
      ))}
    </div>
  );
}
