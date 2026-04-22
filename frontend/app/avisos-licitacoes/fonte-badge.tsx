import type { FonteLicitacao } from '@/types/licitacao';

export function FonteBadge({ fonte }: { fonte: FonteLicitacao }) {
  if (fonte === 'comprasbr') {
    return (
      <span className="rounded-full px-3 py-1 text-label-md font-medium bg-surface-container-high text-on-surface-variant">
        ComprasBR
      </span>
    );
  }
  return (
    <span className="rounded-full px-3 py-1 text-label-md font-medium bg-primary/10 text-primary dark:bg-blue-900/30 dark:text-blue-400">
      Dispensa
    </span>
  );
}
