'use client';

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
        rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200
        ${
          active
            ? 'bg-primary text-on-primary dark:bg-primary/80 dark:text-white shadow-ambient'
            : 'bg-surface-container-high dark:bg-slate-700/40 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60 hover:text-on-surface'
        }
      `}
    >
      {children}
    </button>
  );
}
