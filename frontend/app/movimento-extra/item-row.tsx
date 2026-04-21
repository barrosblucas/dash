'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import type { MovimentoExtraItem } from '@/types/movimento-extra';

import { getGlossaryKey, getGlossary } from './glossario';
import { TipoBadge } from './tipo-badge';

/** Linha de item na tabela/lista */
export function ItemRow({ item }: { item: MovimentoExtraItem }) {
  const glossaryKey = getGlossaryKey(item.descricao);
  const glossary = getGlossary(glossaryKey);
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-4 hover:border-dark-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <div className="relative min-w-0">
            <p className="text-sm font-medium text-dark-200 truncate pr-6">
              {item.descricao}
            </p>
            <button
              onClick={() => setShowTip(!showTip)}
              className="absolute right-0 top-0 text-dark-600 hover:text-dark-400 transition-colors"
              aria-label="Glossário"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTip && (
              <div className="absolute left-0 top-6 z-10 w-64 rounded-lg border border-dark-700/60 bg-dark-900 p-3 shadow-xl">
                <p className="text-xs text-dark-300">{glossary.descricao}</p>
              </div>
            )}
          </div>
        </div>
        <TipoBadge tipo={item.tipo} />
      </div>
      <p className="text-xs text-dark-500 mb-2 truncate">{item.fornecedor}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-600">
          Entidade {item.ent_codigo} · Mês {item.mes}
        </span>
        <span
          className={`
            text-base font-bold
            ${item.tipo === 'R' ? 'text-green-400' : 'text-orange-400'}
          `}
        >
          {formatCurrency(item.valor_recebido)}
        </span>
      </div>
    </div>
  );
}

/** Linha de item para desktop (table row) */
export function ItemTableRow({ item }: { item: MovimentoExtraItem }) {
  const glossaryKey = getGlossaryKey(item.descricao);
  const glossary = getGlossary(glossaryKey);

  return (
    <tr className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <span className="text-sm text-dark-200">{item.descricao}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-dark-400 max-w-[200px] truncate block">{item.fornecedor}</span>
      </td>
      <td className="py-3 px-4">
        <TipoBadge tipo={item.tipo} />
      </td>
      <td className="py-3 px-4 text-right">
        <span
          className={`text-sm font-semibold ${item.tipo === 'R' ? 'text-green-400' : 'text-orange-400'}`}
        >
          {formatCurrency(item.valor_recebido)}
        </span>
      </td>
    </tr>
  );
}
