'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy loading para componentes pesados
import dynamic from 'next/dynamic';

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

export default function DashboardClient() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* KPIs principais */}
        <Suspense fallback={<LoadingSpinner />}>
          <KPISection />
        </Suspense>

        {/* Gráfico combinado: receitas x despesas */}
        <Suspense fallback={<LoadingSpinner />}>
          <CombinedOverviewChart />
        </Suspense>

        {/* Gráficos individuais de receitas e despesas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <RevenueChart />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <ExpenseChart />
          </Suspense>
        </div>

        {/* Previsões e sazonalidade */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <ForecastSection />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <ComparativeSection />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}