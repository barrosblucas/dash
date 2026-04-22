'use client';

import { useState } from 'react';

import Icon from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils';
import type { FundoResumo } from '@/types/movimento-extra';

import { getGlossaryKey, getGlossary } from './glossario';

/** Card de Fundo Resumo */
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
    <div className="surface-card overflow-hidden transition-all duration-200 hover:shadow-card-hover">
      {/* Header do fundo */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: glossary.cor }}
            />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-on-surface truncate">
                {fundo.fundo}
              </h4>
              <p className="text-xs text-on-surface-variant truncate">{glossary.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Info tooltip */}
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                aria-label={`Informações sobre ${fundo.fundo}`}
              >
                <Icon name="info" size={18} />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-9 z-20 w-72 rounded-xl bg-surface-container-highest p-4 shadow-ambient-lg">
                  <p className="text-sm text-on-surface mb-2">{glossary.descricao}</p>
                  <div className="pt-2">
                    <p className="text-xs text-on-surface-variant">
                      <span className="text-tertiary font-medium">Impacto para você:</span>{' '}
                      {glossary.impacto_cidadao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Expandir */}
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <Icon name={expanded ? 'expand_less' : 'expand_more'} size={18} />
            </button>
          </div>
        </div>

        {/* Barra de proporção visual */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden flex">
            <div
              className="h-full bg-secondary/70 rounded-l-full transition-all duration-500"
              style={{ width: `${receitaPct}%` }}
            />
            <div
              className="h-full bg-error/70 rounded-r-full transition-all duration-500"
              style={{ width: `${despesaPct}%` }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Receitas</p>
            <p className="text-sm font-semibold text-secondary">
              {formatCurrency(fundo.total_receitas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Despesas</p>
            <p className="text-sm font-semibold text-error">
              {formatCurrency(fundo.total_despesas)}
            </p>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant/60 mt-2">
          {fundo.quantidade_itens} {fundo.quantidade_itens === 1 ? 'item' : 'itens'} neste fundo
        </p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-surface-container-low/50 px-5 py-3">
          <p className="text-xs text-on-surface-variant italic">
            Expandindo este fundo mostrará os itens individuais abaixo na tabela de resultados.
          </p>
        </div>
      )}
    </div>
  );
}
