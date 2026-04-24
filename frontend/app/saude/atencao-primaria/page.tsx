import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import AtencaoPrimariaClient from './atencao-primaria-client';

export const metadata: Metadata = {
  title: 'Saúde | Atenção primária',
  description: 'Produção da atenção primária por mês, especialidade e CBO.',
};

export default function AtencaoPrimariaPage() {
  return (
    <DashboardLayout>
      <AtencaoPrimariaClient />
    </DashboardLayout>
  );
}
