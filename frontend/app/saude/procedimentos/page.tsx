import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ProcedimentosClient from './procedimentos-client';

export const metadata: Metadata = {
  title: 'Saúde | Procedimentos',
  description: 'Procedimentos por tipo da rede municipal de saúde.',
};

export default function ProcedimentosPage() {
  return (
    <DashboardLayout>
      <ProcedimentosClient />
    </DashboardLayout>
  );
}
