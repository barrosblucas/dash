'use client';

import { useState } from 'react';

import Icon from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils';
import type { FundoResumo } from '@/types/movimento-extra';

import { getGlossaryKey, getGlossary } from './glossario';

export function FundoCard({
  fundo,
  onToggle,
  expanded,
}: {
  fundo: FundoResumo;
  onToggle: () => void;
  expanded: boolean;
}) {
  const glossary = getGlossary(getGlossaryKey(fundo.fundo));
  const total = fundo.total_receitas + fundo.total_despesas;
  const receitaPct = total > 0 ? (fundo.total_receitas / total) * 100 : 0;
  const despesaPct = total > 0 ? (fundo.total_despesas / total) * 100 : 0;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl shadow-ambient overflow-hidden transition-all duration-200 hover:shadow-ambient-lg">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: glossary.cor }}
            />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-on-surface dark:text-white truncate">
                {fundo.fundo}
              </h4>
              <p className="text-xs text-on-surface-variant truncate">{glossary.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-slate-700/40 transition-colors"
                aria-label={`Informações sobre ${fundo.fundo}`}
              >
                <Icon name="info" size={18} />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-9 z-20 w-72 rounded-xl bg-surface-container-highest dark:bg-slate-700 p-4 shadow-ambient-lg">
                  <p className="text-sm text-on-surface dark:text-slate-200 mb-2">{glossary.descricao}</p>
                  <div className="pt-2">
                    <p className="text-xs text-on-surface-variant">
                      <span className="text-tertiary font-medium">Impacto para você:</span>{' '}
                      {glossary.impacto_cidadao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-slate-700/40 transition-colors"
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <Icon name={expanded ? 'expand_less' : 'expand_more'} size={18} />
            </button>
          </div>
        </div>

        {/* Proportion bar */}
        <div className="h-2 rounded-full bg-surface-container-high dark:bg-slate-700/40 overflow-hidden flex">
          <div
            className="h-full bg-secondary/70 dark:bg-emerald-500/60 transition-all duration-500"
            style={{ width: `${receitaPct}%` }}
          />
          <div
            className="h-full bg-error/70 dark:bg-red-500/60 transition-all duration-500"
            style={{ width: `${despesaPct}%` }}
          />
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Receitas</p>
            <p className="text-sm font-semibold text-secondary dark:text-emerald-400">
              {formatCurrency(fundo.total_receitas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Despesas</p>
            <p className="text-sm font-semibold text-error dark:text-red-400">
              {formatCurrency(fundo.total_despesas)}
            </p>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant/60 mt-2">
          {fundo.quantidade_itens} {fundo.quantidade_itens === 1 ? 'item' : 'itens'} neste fundo
        </p>
      </div>

      {expanded && (
        <div className="bg-surface-container-low/50 dark:bg-slate-800/30 px-5 py-3">
          <p className="text-xs text-on-surface-variant italic">
            Expandindo este fundo mostrará os itens individuais abaixo na tabela de resultados.
          </p>
        </div>
      )}
    </div>
  );
}
