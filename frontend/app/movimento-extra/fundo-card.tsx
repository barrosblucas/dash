'use client';

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div
      className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-dark-600/60"
    >
      {/* Header do fundo */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: glossary.cor }}
            />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-dark-100 truncate">
                {fundo.fundo}
              </h4>
              <p className="text-xs text-dark-500 truncate">{glossary.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Info tooltip */}
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-300 hover:bg-dark-700/50 transition-colors"
                aria-label={`Informações sobre ${fundo.fundo}`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-9 z-20 w-72 rounded-xl border border-dark-700/60 bg-dark-900 p-4 shadow-xl">
                  <p className="text-sm text-dark-200 mb-2">{glossary.descricao}</p>
                  <div className="border-t border-dark-700/50 pt-2">
                    <p className="text-xs text-dark-400">
                      <span className="text-forecast-400 font-medium">Impacto para você:</span>{' '}
                      {glossary.impacto_cidadao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Expandir */}
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-300 hover:bg-dark-700/50 transition-colors"
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Barra de proporção visual */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 rounded-full bg-dark-700/60 overflow-hidden flex">
            <div
              className="h-full bg-green-500/70 rounded-l-full transition-all duration-500"
              style={{ width: `${receitaPct}%` }}
            />
            <div
              className="h-full bg-orange-500/70 rounded-r-full transition-all duration-500"
              style={{ width: `${despesaPct}%` }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-dark-500 mb-0.5">Receitas</p>
            <p className="text-sm font-semibold text-green-400">
              {formatCurrency(fundo.total_receitas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500 mb-0.5">Despesas</p>
            <p className="text-sm font-semibold text-orange-400">
              {formatCurrency(fundo.total_despesas)}
            </p>
          </div>
        </div>

        <p className="text-xs text-dark-500 mt-2">
          {fundo.quantidade_itens} {fundo.quantidade_itens === 1 ? 'item' : 'itens'} neste fundo
        </p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-dark-700/40 bg-dark-900/40 px-5 py-3">
          <p className="text-xs text-dark-500 italic">
            Expandindo este fundo mostrará os itens individuais abaixo na tabela de resultados.
          </p>
        </div>
      )}
    </div>
  );
}
