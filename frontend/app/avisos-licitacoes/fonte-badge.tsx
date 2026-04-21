/**
 * Badge de fonte de licitação
 */

import type { FonteLicitacao } from '@/types/licitacao';

export function FonteBadge({ fonte }: { fonte: FonteLicitacao }) {
  if (fonte === 'comprasbr') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-forecast-500/15 text-forecast-400">
        ComprasBR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/15 text-accent-400">
      Dispensa
    </span>
  );
}
