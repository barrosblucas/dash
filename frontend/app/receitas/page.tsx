import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ReceitasClient from './receitas-client';

export const metadata: Metadata = {
  title: 'Receitas Municipais',
  description: 'Análise detalhada das receitas municipais de Bandeirantes MS',
};

export default function ReceitasPage() {
  return (
    <DashboardLayout>
      <ReceitasClient />
    </DashboardLayout>
  );
}
