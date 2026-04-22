'use client';

import { useState, useCallback, useMemo } from 'react';

import type { ReceitaDetalhamento } from '@/types/receita';
import { formatCurrency, formatPercent } from '@/lib/utils';

/* ── Props ── */
interface ReceitaDetalhamentoTableProps {
  itens: ReceitaDetalhamento[];
}

/* ── Indentação por nível ── */
const INDENT_MAP: Record<number, string> = {
  1: 'pl-3',
  2: 'pl-11',
  3: 'pl-[4.5rem]',
  4: 'pl-[6.5rem]',
  5: 'pl-[8.5rem]',
};

function getIndent(nivel: number): string {
  return INDENT_MAP[nivel] ?? 'pl-[8.5rem]';
}

/* ── Cor do % de execução ── */
function getExecColor(pct: number): string {
  if (pct >= 90) return 'text-secondary';
  if (pct >= 70) return 'text-tertiary';
  return 'text-error';
}

/* ── Verifica se valor é dedução ── */
function isDeducao(item: ReceitaDetalhamento): boolean {
  return item.detalhamento.startsWith('(-)');
}

/**
 * Tabela hierárquica de detalhamento de receitas
 * com expand/collapse por nível (formato escadinha)
 * Design: The Architectural Archive — tonal layering, no borders
 */
export default function ReceitaDetalhamentoTable({ itens }: ReceitaDetalhamentoTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const hasChildren = useCallback(
    (index: number): boolean => {
      const next = itens[index + 1];
      return next !== undefined && next.nivel > itens[index].nivel;
    },
    [itens]
  );

  const isVisible = useCallback(
    (index: number): boolean => {
      if (itens[index].nivel === 1) return true;
      let targetNivel = itens[index].nivel - 1;
      for (let i = index - 1; i >= 0; i--) {
        if (itens[i].nivel === targetNivel) {
          if (!expandedIds.has(itens[i].id)) return false;
          targetNivel--;
          if (targetNivel === 0) break;
        }
      }
      return true;
    },
    [itens, expandedIds]
  );

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const visibleRows = useMemo(
    () => itens.map((item, idx) => ({ item, idx, visible: isVisible(idx) })),
    [itens, isVisible]
  );

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <th className="px-6 py-3 text-left font-medium bg-surface-container-low dark:bg-slate-800/30 sticky top-0 z-10">
              Detalhamento
            </th>
            <th className="px-4 py-3 text-right font-medium bg-surface-container-low dark:bg-slate-800/30 sticky top-0 z-10">
              Previsto (Anual)
            </th>
            <th className="px-4 py-3 text-right font-medium bg-surface-container-low dark:bg-slate-800/30 sticky top-0 z-10">
              Arrecadado
            </th>
            <th className="px-4 py-3 text-right font-medium bg-surface-container-low dark:bg-slate-800/30 sticky top-0 z-10">
              Anulado
            </th>
            <th className="px-4 py-3 text-right font-medium bg-surface-container-low dark:bg-slate-800/30 sticky top-0 z-10">
              % Exec.
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(({ item, idx, visible }, rowIndex) => {
            if (!visible) return null;

            const isExpanded = expandedIds.has(item.id);
            const hasKids = hasChildren(idx);
            const execPct = item.valor_previsto > 0
              ? (item.valor_arrecadado / item.valor_previsto) * 100
              : 0;
            const deducao = isDeducao(item);
            const isBold = item.nivel === 1;

            return (
              <tr
                key={item.id}
                className={`transition-colors duration-150 ${
                  hasKids ? 'cursor-pointer' : 'cursor-default'
                } ${
                  rowIndex % 2 === 0
                    ? 'bg-surface-container-lowest dark:bg-slate-800/20'
                    : 'bg-surface-container-low/60 dark:bg-slate-800/30'
                } hover:bg-surface-container dark:hover:bg-slate-800/40`}
                onClick={() => hasKids && toggleExpand(item.id)}
              >
                {/* Detalhamento */}
                <td className={`py-2.5 pr-4 ${getIndent(item.nivel)}`}>
                  <div className="flex items-center gap-1.5">
                    {hasKids ? (
                      <span
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-md
                                    text-primary dark:text-primary-100 transition-transform duration-200
                                    ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          expand_more
                        </span>
                      </span>
                    ) : (
                      <span className="w-5 shrink-0" />
                    )}
                    <span
                      className={`${
                        isBold ? 'font-semibold text-on-surface' : 'text-on-surface'
                      } ${deducao ? 'text-error' : ''}`}
                    >
                      {item.detalhamento}
                    </span>
                  </div>
                </td>

                {/* Previsto */}
                <td className={`px-4 py-2.5 text-right font-mono ${deducao ? 'text-error' : 'text-on-surface-variant'}`}>
                  {formatCurrency(item.valor_previsto)}
                </td>

                {/* Arrecadado */}
                <td className={`px-4 py-2.5 text-right font-mono font-medium ${item.valor_arrecadado < 0 || deducao ? 'text-error' : 'text-secondary'}`}>
                  {formatCurrency(item.valor_arrecadado)}
                </td>

                {/* Anulado */}
                <td className={`px-4 py-2.5 text-right font-mono ${deducao ? 'text-error' : 'text-on-surface-variant'}`}>
                  {formatCurrency(item.valor_anulado)}
                </td>

                {/* % Execução */}
                <td className="px-4 py-2.5 text-right font-mono">
                  <span className={deducao ? 'text-error' : getExecColor(execPct)}>
                    {formatPercent(execPct)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
