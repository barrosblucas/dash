/** Badge de tipo (R/D) */
export function TipoBadge({ tipo }: { tipo: 'R' | 'D' }) {
  const isRevenue = tipo === 'R';
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${isRevenue ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}
      `}
    >
      {isRevenue ? 'Receita' : 'Despesa'}
    </span>
  );
}
