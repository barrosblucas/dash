import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import SaudeBucalClient from './saude-bucal-client';

export const metadata: Metadata = {
  title: 'Saúde | Saúde bucal',
  description: 'Atendimentos odontológicos por mês com visão do total do período.',
};

export default function SaudeBucalPage() {
  return (
    <DashboardLayout>
      <SaudeBucalClient />
    </DashboardLayout>
  );
}
