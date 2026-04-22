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
            ? 'bg-primary text-on-primary shadow-ambient'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }
      `}
    >
      {children}
    </button>
  );
}
