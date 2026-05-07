import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import SecretariasClient from './secretarias-client';

export const metadata: Metadata = {
  title: 'Secretarias e Autarquias',
  description: 'Conheça as secretarias municipais e as autarquias que prestam serviços à população.',
};

export default function SecretariasPage() {
  return (
    <DashboardLayout>
      <SecretariasClient />
    </DashboardLayout>
  );
}
