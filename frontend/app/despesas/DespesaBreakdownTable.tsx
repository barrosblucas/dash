'use client';

import { useState, useMemo } from 'react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useDespesasBreakdownTotais } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/utils';

const BREAKDOWN_OPTIONS = [
  { value: 'NATUREZA', label: 'Natureza de Despesa' },
  { value: 'FUNCAO', label: 'Função' },
  { value: 'ORGAO', label: 'Órgão' },
  { value: 'ELEMENTO', label: 'Elemento de Despesa' },
] as const;

const TH_BASE = 'px-4 py-3 font-medium bg-surface-container-low sticky top-0';

interface DespesaBreakdownTableProps {
  ano: number;
}

export default function DespesaBreakdownTable({ ano }: DespesaBreakdownTableProps) {
  const [breakdownType, setBreakdownType] = useState<string>('NATUREZA');
  const { data: breakdownData, isLoading: isLoadingBreakdown } = useDespesasBreakdownTotais(breakdownType, ano);

  const breakdownItems = useMemo(() => {
    if (!breakdownData?.items.length) return [];
    const total = breakdownData.items.reduce((s, item) => s + item.total_valor, 0);
    return breakdownData.items
      .map((item) => ({
        label: item.item_label,
        valor: item.total_valor,
        percent: total > 0 ? (item.total_valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [breakdownData]);

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-ambient">
      <div className="p-6 pb-0 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>donut_small</span>
          <h3 className="text-title-md font-display text-on-surface">Detalhamento por Categoria</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {BREAKDOWN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBreakdownType(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-label-md font-medium transition-colors ${
                breakdownType === opt.value
                  ? 'bg-secondary text-on-secondary dark:bg-secondary dark:text-on-secondary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 pt-4">
        {isLoadingBreakdown ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <LoadingSpinner message="Carregando detalhamento..." />
          </div>
        ) : breakdownItems.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 mb-3 block mx-auto" style={{ fontSize: '40px' }}>search_off</span>
            <p className="text-body-md text-on-surface-variant">Nenhum dado encontrado para o filtro selecionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                  <th className={`${TH_BASE} text-left`}>Item</th>
                  <th className={`${TH_BASE} text-right`}>Valor Total</th>
                  <th className={`${TH_BASE} text-right`}>%</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((item, i) => (
                  <tr
                    key={item.label}
                    className={`transition-colors duration-150 hover:bg-surface-container ${
                      i % 2 === 1 ? 'bg-surface-container-low/50' : 'bg-surface-container-lowest'
                    }`}
                  >
                    <td className="px-4 py-3 text-on-surface font-medium">{item.label}</td>
                    <td className="px-4 py-3 text-right text-on-surface font-mono">{formatCurrency(item.valor, { compact: true })}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-label-md font-medium text-error w-12 text-right">{item.percent.toFixed(1)}%</span>
                        <div className="w-16 h-2 rounded-full bg-surface-container overflow-hidden">
                          <div className="h-full rounded-full bg-error/70 transition-all duration-500" style={{ width: `${Math.min(item.percent, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
