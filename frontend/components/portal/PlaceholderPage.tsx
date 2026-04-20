'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowLeftRight,
  BellRing,
  Building2,
  Construction,
  FileText,
  Gavel,
  Plane,
  type LucideIcon,
} from 'lucide-react';

import DashboardLayout from '@/components/layouts/DashboardLayout';

/* ────────────────────────────────────────────
   Mapeamento de nomes de ícone → componente
   Necessário porque Server Components não
   podem serializar funções para Client Components.
   ──────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowLeftRight,
  BellRing,
  Building2,
  FileText,
  Gavel,
  Plane,
};

/* ────────────────────────────────────────────
   Props
   ──────────────────────────────────────────── */

interface PlaceholderPageProps {
  title: string;
  description: string;
  iconName: keyof typeof ICON_MAP;
}

/* ────────────────────────────────────────────
   Componente
   ──────────────────────────────────────────── */

/**
 * Página placeholder reutilizável para seções "Em breve" do portal.
 * Envolve conteúdo com DashboardLayout para manter consistência visual
 * com as páginas internas existentes.
 */
export default function PlaceholderPage({ title, description, iconName }: PlaceholderPageProps) {
  const Icon = ICON_MAP[iconName];

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-dark-400" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Construction className="w-5 h-5 text-expense-500" />
          <span className="badge badge-warning">Em breve</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-dark-100 mb-3">
          {title}
        </h1>

        <p className="text-dark-400 text-base max-w-md leading-relaxed mb-8">
          {description}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                     bg-dark-800 border border-dark-700 text-dark-200
                     hover:bg-dark-700 hover:border-dark-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Portal
        </Link>
      </div>
    </DashboardLayout>
  );
}
