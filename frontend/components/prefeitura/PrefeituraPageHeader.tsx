'use client';

import type { ReactNode } from 'react';

interface PrefeituraPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PrefeituraPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PrefeituraPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-outline/10 bg-surface-container-low px-6 py-8 shadow-ambient sm:px-8">
      <div className="absolute inset-y-0 right-0 hidden w-64 bg-[radial-gradient(circle_at_top,rgba(0,45,98,0.14),transparent_70%)] lg:block" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-headline text-3xl font-extrabold text-primary sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-base leading-7 text-on-surface-variant">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-start gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
