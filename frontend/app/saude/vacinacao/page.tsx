import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import VacinacaoClient from './vacinacao-client';

export const metadata: Metadata = {
  title: 'Saúde | Vacinação',
  description: 'Cobertura vacinal anual com série mensal e ranking das vacinas aplicadas.',
};

export default function VacinacaoPage() {
  return (
    <DashboardLayout>
      <VacinacaoClient />
    </DashboardLayout>
  );
}
