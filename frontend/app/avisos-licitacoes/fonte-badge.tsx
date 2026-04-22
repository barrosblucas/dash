/**
 * Badge de fonte de licitação
 */

import type { FonteLicitacao } from '@/types/licitacao';

export function FonteBadge({ fonte }: { fonte: FonteLicitacao }) {
  if (fonte === 'comprasbr') {
    return (
      <span className="chip-tertiary text-xs">
        ComprasBR
      </span>
    );
  }
  return (
    <span className="chip-primary text-xs">
      Dispensa
      </span>
  );
}
