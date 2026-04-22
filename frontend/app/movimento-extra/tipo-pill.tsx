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
            ? 'bg-primary/15 text-primary ring-1 ring-primary/25 shadow-ambient'
            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
        }
      `}
    >
      {children}
    </button>
  );
}
