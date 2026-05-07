import type { ReactNode } from 'react';

interface PrefeituraCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PrefeituraCard({ title, description, children, className = '' }: PrefeituraCardProps) {
  return (
    <section className={`rounded-[28px] border border-outline/10 bg-surface-container-low p-6 shadow-ambient ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="font-headline text-xl font-bold text-primary">{title}</h2>}
          {description && <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
