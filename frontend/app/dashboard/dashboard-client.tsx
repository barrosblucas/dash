'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
   Animações
   ──────────────────────────────────────────── */

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export default function DashboardClient() {
  return (
    <DashboardLayout>
      <motion.div
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* KPIs principais */}
        <motion.section variants={sectionVariants}>
          <Suspense fallback={<LoadingSpinner />}>
            <KPISection />
          </Suspense>
        </motion.section>

        {/* Gráfico combinado: receitas x despesas */}
        <motion.section variants={sectionVariants}>
          <Suspense fallback={<LoadingSpinner />}>
            <CombinedOverviewChart />
          </Suspense>
        </motion.section>

        {/* Gráficos individuais de receitas e despesas */}
        <motion.section
          variants={sectionVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <RevenueChart />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <ExpenseChart />
          </Suspense>
        </motion.section>

        {/* Previsões e comparativo */}
        <motion.section
          variants={sectionVariants}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2">
            <Suspense fallback={<LoadingSpinner />}>
              <ForecastSection />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<LoadingSpinner />}>
              <ComparativeSection />
            </Suspense>
          </div>
        </motion.section>
      </motion.div>
    </DashboardLayout>
  );
}
