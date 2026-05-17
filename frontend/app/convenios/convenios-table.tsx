'use client';

import { formatCurrency } from '@/lib/utils';
import type { ConvenioItem } from '@/types/convenio';
import type { SortField, SortDir } from './convenios-hooks';

/* ── Badges ── */

export function ConvenioTipoBadge({ tipo }: { tipo: string }) {
  const isConcedido = tipo === 'Concedido';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${
        isConcedido
          ? 'bg-secondary/10 text-secondary'
          : 'bg-[#06b6d418] text-[#06b6d4]'
      }`}
    >
      {tipo}
    </span>
  );
}

export function ConvenioEsferaBadge({ esfera }: { esfera: string }) {
  const colorMap: Record<string, string> = {
    Municipal: 'bg-[#22c55e18] text-[#22c55e]',
    Estadual: 'bg-[#a855f718] text-[#a855f7]',
    Federal: 'bg-[#3b82f618] text-[#3b82f6]',
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${
        colorMap[esfera] || 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      {esfera}
    </span>
  );
}

export function ConvenioSituacaoBadge({ situacao }: { situacao: string }) {
  const lower = situacao.toLowerCase();
  const isActive = lower.includes('ativo') || lower.includes('vigente');
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${
        isActive
          ? 'bg-[#22c55e18] text-[#22c55e]'
          : 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      {situacao}
    </span>
  );
}

/* ── Table Header Cell ── */

interface ThProps {
  sortField: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (field: SortField) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

function Th({
  sortField,
  current,
  dir,
  onClick,
  children,
  align = 'left',
}: ThProps) {
  return (
    <th
      className={`py-3 px-4 cursor-pointer hover:text-on-surface transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onClick(sortField)}
    >
      {children}{' '}
      {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

/* ── Table Row (expandable) ── */

function ConvenioTableRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: ConvenioItem;
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
            <span className="text-sm text-on-surface font-medium">
              {item.numero}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <ConvenioTipoBadge tipo={item.tipo} />
        </td>
        <td className="py-3 px-4">
          <ConvenioEsferaBadge esfera={item.esfera} />
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[200px] truncate block">
            {item.concedente}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant max-w-[200px] truncate block">
            {item.convenente}
          </span>
        </td>
        <td className="py-3 px-4">
          <ConvenioSituacaoBadge situacao={item.situacao} />
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.valor)}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant">
              <span>
                <span className="font-medium text-on-surface">Assinatura:</span>{' '}
                {item.assinatura}
              </span>
              <span>
                <span className="font-medium text-on-surface">Convenente:</span>{' '}
                {item.convenente}
              </span>
              <span>
                <span className="font-medium text-on-surface">Esfera:</span>{' '}
                {item.esfera}
              </span>
              <span>
                <span className="font-medium text-on-surface">Ano:</span>{' '}
                {item.ano}
              </span>
              <span className="w-full mt-1">
                <span className="font-medium text-on-surface">Objeto:</span>{' '}
                {item.objeto}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Desktop Convenios Table ── */

interface ConvenioTableProps {
  items: ConvenioItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedNumero: string | null;
  onToggleExpand: (numero: string) => void;
}

export function ConvenioTable({
  items,
  sortField,
  sortDir,
  onSort,
  expandedNumero,
  onToggleExpand,
}: ConvenioTableProps) {
  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th
              sortField="numero"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Convenio
            </Th>
            <Th
              sortField="tipo"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Tipo
            </Th>
            <Th
              sortField="esfera"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Esfera
            </Th>
            <Th
              sortField="concedente"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Concedente
            </Th>
            <Th
              sortField="convenente"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Convenente
            </Th>
            <Th
              sortField="situacao"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
            >
              Situacao
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
            <ConvenioTableRow
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
