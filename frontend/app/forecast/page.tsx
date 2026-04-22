import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ForecastClient from './forecast-client';

export const metadata: Metadata = {
  title: 'Previsões Financeiras',
  description: 'Projeções financeiras do município de Bandeirantes MS',
};

export default function ForecastPage() {
  return (
    <DashboardLayout>
      <ForecastClient />
    </DashboardLayout>
  );
}
