import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import MedicamentosClient from './medicamentos-client';

export const metadata: Metadata = {
  title: 'Saúde | Medicamentos',
  description: 'Estoque público e ranking de medicamentos dispensados.',
};

export default function MedicamentosPage() {
  return (
    <DashboardLayout>
      <MedicamentosClient />
    </DashboardLayout>
  );
}
