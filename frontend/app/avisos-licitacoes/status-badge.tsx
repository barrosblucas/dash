export function StatusBadge({ status }: { status: string }) {
  const startsWith = status.startsWith('AGUARDANDO');
  let classes = '';
  let label = status;

  if (startsWith) {
    classes = 'bg-secondary/10 text-secondary dark:bg-secondary/10';
    label = 'Aguardando';
  } else if (status === 'ENCERRADO') {
    classes = 'bg-on-surface-variant/10 text-on-surface-variant dark:bg-on-surface-variant/10';
    label = 'Encerrado';
  } else if (status === 'SUSPENSO') {
    classes = 'bg-error/10 text-error dark:bg-error/10';
    label = 'Suspenso';
  } else {
    classes = 'bg-on-surface-variant/10 text-on-surface-variant dark:bg-on-surface-variant/10';
  }

  return (
    <span className={`rounded-full px-3 py-1 text-label-md font-medium ${classes}`}>
      {label}
    </span>
  );
}
