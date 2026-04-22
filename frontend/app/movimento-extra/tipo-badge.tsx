'use client';

export function TipoBadge({ tipo }: { tipo: string }) {
  const isReceita = tipo === 'R';

  return (
    <span
      className={`
        rounded-full px-2.5 py-0.5 text-label-md font-medium
        ${isReceita
          ? 'bg-secondary/10 text-secondary dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-error/10 text-error dark:bg-red-900/30 dark:text-red-400'
        }
      `}
    >
      {isReceita ? 'Receita' : 'Despesa'}
    </span>
  );
}
