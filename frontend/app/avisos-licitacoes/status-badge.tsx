/**
 * Badge de status de licitação
 */

export function StatusBadge({ status }: { status: string }) {
  const startsWith = status.startsWith('AGUARDANDO');
  let classes = 'bg-dark-700/60 text-dark-400';
  let label = status;

  if (startsWith) {
    classes = 'bg-green-500/15 text-green-400';
    label = 'Aguardando';
  } else if (status === 'ENCERRADO') {
    classes = 'bg-dark-700/60 text-dark-400';
    label = 'Encerrado';
  } else if (status === 'SUSPENSO') {
    classes = 'bg-orange-500/15 text-orange-400';
    label = 'Suspenso';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
