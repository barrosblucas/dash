'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export default function ReceitasClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-6">
          <h2 className="text-headline-sm font-display font-bold text-on-surface mb-2">Receitas Municipais</h2>
          <p className="text-body-md text-on-surface-variant">
            Acompanhamento detalhado da arrecadação e repasses ao município.
          </p>
        </div>

        <div className="glass-card p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <RevenueChart />
            </Suspense>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
