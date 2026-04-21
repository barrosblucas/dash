'use client';

/** Botão pill do tipo de filtro */
export function TipoPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${
          active
            ? 'bg-forecast-500/20 text-forecast-300 border border-forecast-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
            : 'bg-dark-800/60 text-dark-400 border border-dark-700/50 hover:text-dark-300 hover:border-dark-600'
        }
      `}
    >
      {children}
    </button>
  );
}
