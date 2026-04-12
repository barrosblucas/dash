'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ReceitaDetalhamento } from '@/types/receita';
import { formatCurrency, formatPercent } from '@/lib/utils';

// --- Props ---
interface ReceitaDetalhamentoTableProps {
  itens: ReceitaDetalhamento[];
}

// --- Indentação por nível ---
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

// --- Cor do % de execução ---
function getExecColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-400';
  if (pct >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

// --- Verifica se valor é dedução (negativo ou prefixo "(-)") ---
function isDeducao(item: ReceitaDetalhamento): boolean {
  return item.detalhamento.startsWith('(-)');
}

/**
 * Tabela hierárquica de detalhamento de receitas
 * com expand/collapse por nível (formato escadinha)
 */
export default function ReceitaDetalhamentoTable({ itens }: ReceitaDetalhamentoTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  // Determina se o item tem filhos (próximo item tem nível maior)
  const hasChildren = useCallback(
    (index: number): boolean => {
      const next = itens[index + 1];
      return next !== undefined && next.nivel > itens[index].nivel;
    },
    [itens]
  );

  // Verifica se uma linha é visível (todos os ancestrais expandidos)
  const isVisible = useCallback(
    (index: number): boolean => {
      if (itens[index].nivel === 1) return true;
      // Percorre de trás pra frente, verificando cadeia de ancestrais
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

  // Memoiza linhas visíveis para performance
  const visibleRows = useMemo(
    () => itens.map((item, idx) => ({ item, idx, visible: isVisible(idx) })),
    [itens, isVisible]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-700/50 text-dark-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left font-medium">Detalhamento</th>
            <th className="px-4 py-3 text-right font-medium">Previsto (Anual)</th>
            <th className="px-4 py-3 text-right font-medium">Arrecadado</th>
            <th className="px-4 py-3 text-right font-medium">Anulado</th>
            <th className="px-4 py-3 text-right font-medium">% Exec.</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(({ item, idx, visible }) => {
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
                className={`hover:bg-dark-700/30 transition-colors cursor-${
                  hasKids ? 'pointer' : 'default'
                } ${idx % 2 === 0 ? 'bg-dark-800/30' : 'bg-dark-800/10'}`}
                onClick={() => hasKids && toggleExpand(item.id)}
              >
                {/* Coluna Detalhamento */}
                <td className={`py-2.5 pr-4 ${getIndent(item.nivel)}`}>
                  <div className="flex items-center gap-1.5">
                    {/* Ícone expand/collapse */}
                    {hasKids ? (
                      <span className="text-dark-400 text-xs w-4 shrink-0 select-none">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span
                      className={`${
                        isBold ? 'font-semibold text-dark-100' : 'text-dark-200'
                      } ${deducao ? 'text-red-400' : ''}`}
                    >
                      {item.detalhamento}
                    </span>
                  </div>
                </td>

                {/* Previsto */}
                <td className={`px-4 py-2.5 text-right ${deducao ? 'text-red-400' : 'text-dark-300'}`}>
                  {formatCurrency(item.valor_previsto)}
                </td>

                {/* Arrecadado */}
                <td className={`px-4 py-2.5 text-right font-medium ${item.valor_arrecadado < 0 || deducao ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(item.valor_arrecadado)}
                </td>

                {/* Anulado */}
                <td className={`px-4 py-2.5 text-right ${deducao ? 'text-red-400' : 'text-dark-400'}`}>
                  {formatCurrency(item.valor_anulado)}
                </td>

                {/* % Execução */}
                <td className="px-4 py-2.5 text-right">
                  <span className={deducao ? 'text-red-400' : getExecColor(execPct)}>
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
