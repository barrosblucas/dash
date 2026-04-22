'use client';

import Link from 'next/link';

import DashboardLayout from '@/components/layouts/DashboardLayout';

/* ── Props ── */

interface PlaceholderPageProps {
  title: string;
  description: string;
  iconName: string;
}

/* ── Componente ── */

/**
 * Página placeholder reutilizável para seções "Em breve" do portal.
 * Usa DashboardLayout para manter consistência visual com as páginas internas.
 */
export default function PlaceholderPage({ title, description, iconName }: PlaceholderPageProps) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-surface-container-low dark:bg-slate-800/50 flex items-center justify-center mb-6 shadow-ambient">
          <span className="material-symbols-outlined text-primary dark:text-primary text-4xl">
            {iconName}
          </span>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-tertiary text-lg">
            construction
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 text-on-tertiary-container text-label-md font-medium">
            Em breve
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-on-surface dark:text-white mb-3">
          {title}
        </h1>

        {/* Description */}
        <p className="text-on-surface-variant dark:text-slate-400 text-base max-w-md leading-relaxed mb-8">
          {description}
        </p>

        {/* Back link */}
        <Link
          href="/"
          className="btn-primary"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar ao Portal
        </Link>
      </div>
    </DashboardLayout>
  );
}
