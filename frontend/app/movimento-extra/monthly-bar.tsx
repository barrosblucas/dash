import { formatCurrency } from '@/lib/utils';
import { MESES_ABREV } from '@/lib/constants';
import type { ResumoMensalItem } from '@/types/movimento-extra';

export function MonthlyEvolutionBar({ item, maxVal }: { item: ResumoMensalItem; maxVal: number }) {
  const receitaW = maxVal > 0 ? (item.total_receitas / maxVal) * 100 : 0;
  const despesaW = maxVal > 0 ? (item.total_despesas / maxVal) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-on-surface-variant w-8 shrink-0 font-medium">
        {MESES_ABREV[item.mes - 1]}
      </span>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary/70 dark:bg-emerald-500/60 rounded-full transition-all duration-500"
              style={{ width: `${receitaW}%` }}
            />
          </div>
          <span className="text-xs text-secondary w-20 text-right font-medium">
            {formatCurrency(item.total_receitas)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-error/70 dark:bg-red-500/60 rounded-full transition-all duration-500"
              style={{ width: `${despesaW}%` }}
            />
          </div>
          <span className="text-xs text-error w-20 text-right font-medium">
            {formatCurrency(item.total_despesas)}
          </span>
        </div>
      </div>
    </div>
  );
}
