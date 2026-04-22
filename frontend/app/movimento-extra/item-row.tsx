'use client';

import { useState } from 'react';

import Icon from '@/components/ui/Icon';
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
    <div className="surface-card p-4 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <div className="relative min-w-0">
            <p className="text-sm font-medium text-on-surface truncate pr-6">
              {item.descricao}
            </p>
            <button
              onClick={() => setShowTip(!showTip)}
              className="absolute right-0 top-0 text-outline hover:text-on-surface-variant transition-colors"
              aria-label="Glossário"
            >
              <Icon name="help" size={16} />
            </button>
            {showTip && (
              <div className="absolute left-0 top-6 z-10 w-64 rounded-xl bg-surface-container-highest p-3 shadow-ambient-lg">
                <p className="text-xs text-on-surface-variant">{glossary.descricao}</p>
              </div>
            )}
          </div>
        </div>
        <TipoBadge tipo={item.tipo} />
      </div>
      <p className="text-xs text-on-surface-variant mb-2 truncate">{item.fornecedor}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">
          Entidade {item.ent_codigo} · Mês {item.mes}
        </span>
        <span
          className={`
            text-base font-bold
            ${item.tipo === 'R' ? 'text-secondary' : 'text-error'}
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
    <tr className="hover:bg-surface-container transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <span className="text-sm text-on-surface">{item.descricao}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-on-surface-variant max-w-[200px] truncate block">{item.fornecedor}</span>
      </td>
      <td className="py-3 px-4">
        <TipoBadge tipo={item.tipo} />
      </td>
      <td className="py-3 px-4 text-right">
        <span
          className={`text-sm font-semibold ${item.tipo === 'R' ? 'text-secondary' : 'text-error'}`}
        >
          {formatCurrency(item.valor_recebido)}
        </span>
      </td>
    </tr>
  );
}
