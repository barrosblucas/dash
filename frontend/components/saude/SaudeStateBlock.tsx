'use client';

import type { ReactNode } from 'react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SaudeStateBlockProps {
  type: 'loading' | 'error' | 'empty';
  title: string;
  description?: string;
  action?: ReactNode;
}

const iconByType = {
  error: 'error',
  empty: 'search_off',
} as const;

export default function SaudeStateBlock({ type, title, description, action }: SaudeStateBlockProps) {
  return (
    <div className="rounded-3xl bg-surface-container-low p-8 text-center shadow-ambient">
      {type === 'loading' ? (
        <LoadingSpinner message={title} />
      ) : (
        <>
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
            {iconByType[type]}
          </span>
          <p className="mt-4 font-headline text-lg font-bold text-primary">{title}</p>
          {description ? <p className="mt-2 text-sm text-on-surface-variant">{description}</p> : null}
          {action ? <div className="mt-5">{action}</div> : null}
        </>
      )}
    </div>
  );
}
