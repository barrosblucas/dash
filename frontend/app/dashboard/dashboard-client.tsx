'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';

// Lazy loading para componentes pesados
const KPISection = dynamic(
  () => import('@/components/dashboard/KPISection'),
  { loading: () => <LoadingSpinner />, ssr: true }
);

const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const ExpenseChart = dynamic(
  () => import('@/components/charts/ExpenseChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const ForecastSection = dynamic(
  () => import('@/components/dashboard/ForecastSection'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const ComparativeSection = dynamic(
  () => import('@/components/dashboard/ComparativeSection'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const CombinedOverviewChart = dynamic(
  () => import('@/components/charts/CombinedOverviewChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

/* ────────────────────────────────────────────
   Year Selector
   ──────────────────────────────────────────── */

function YearSelector() {
  const { anoSelecionado, setAnoSelecionado } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="
          inline-flex items-center gap-2 px-4 py-2
          bg-surface-container-low
          rounded-xl text-label-md font-semibold text-on-surface
          hover:bg-surface-container
          transition-colors duration-200
        "
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_month</span>
        {anoSelecionado}
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="
          absolute right-0 top-full mt-2 z-50
          bg-surface-container-lowest
          rounded-xl shadow-ambient-lg py-1 min-w-[120px]
        ">
          {anos.map((ano) => (
            <button
              key={ano}
              type="button"
              onClick={() => {
                setAnoSelecionado(ano);
                setOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2 text-label-md transition-colors duration-150
                ${ano === anoSelecionado
                  ? 'bg-primary-container/20 text-primary font-semibold'
                  : 'text-on-surface hover:bg-surface-container-low'
                }
              `}
            >
              {ano}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Section Card Wrapper
   ──────────────────────────────────────────── */

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        bg-surface-container-lowest
        rounded-xl shadow-ambient hover:shadow-ambient-lg
        transition-shadow duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────
   Dashboard Client
   ──────────────────────────────────────────── */

export default function DashboardClient() {
  const lastUpdate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Page Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-headline-lg text-on-surface tracking-tight">
              Painel Financeiro
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Visão geral das finanças municipais
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-label-md text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
              Atualizado: {lastUpdate}
            </span>
            <YearSelector />
          </div>
        </header>

        {/* ── KPI Row ── */}
        <section>
          <Suspense fallback={<LoadingSpinner />}>
            <KPISection />
          </Suspense>
        </section>

        {/* ── Charts: Revenue + Expense (side by side on lg) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard className="p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <RevenueChart />
            </Suspense>
          </SectionCard>

          <SectionCard className="p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <ExpenseChart />
            </Suspense>
          </SectionCard>
        </section>

        {/* ── Combined Overview (full width) ── */}
        <section>
          <SectionCard className="p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <CombinedOverviewChart />
            </Suspense>
          </SectionCard>
        </section>

        {/* ── Forecast + Comparative ── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SectionCard className="p-6">
              <Suspense fallback={<LoadingSpinner />}>
                <ForecastSection />
              </Suspense>
            </SectionCard>
          </div>

          <div>
            <SectionCard className="p-6">
              <Suspense fallback={<LoadingSpinner />}>
                <ComparativeSection />
              </Suspense>
            </SectionCard>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
