/**
 * Badge de status de licitação
 */

export function StatusBadge({ status }: { status: string }) {
  const startsWith = status.startsWith('AGUARDANDO');
  let classes = 'chip-secondary';
  let label = status;

  if (startsWith) {
    classes = 'chip-secondary';
    label = 'Aguardando';
  } else if (status === 'ENCERRADO') {
    classes = 'chip';
    label = 'Encerrado';
  } else if (status === 'SUSPENSO') {
    classes = 'chip-error';
    label = 'Suspenso';
  }

  return (
    <span className={`${classes} text-xs`}>
      {label}
    </span>
  );
}
