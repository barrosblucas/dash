import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import FarmaciaClient from './farmacia-client';

export const metadata: Metadata = {
  title: 'Saúde | Farmácia',
  description: 'Atendimentos de medicamentos e dispensações mensais da farmácia.',
};

export default function FarmaciaPage() {
  return (
    <DashboardLayout>
      <FarmaciaClient />
    </DashboardLayout>
  );
}
