import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import DespesasClient from './despesas-client';

export const metadata: Metadata = {
  title: 'Despesas Municipais',
  description: 'Análise detalhada das despesas municipais de Bandeirantes MS',
};

export default function DespesasPage() {
  return (
    <DashboardLayout>
      <DespesasClient />
    </DashboardLayout>
  );
}
