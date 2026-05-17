import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import DiariasClient from './diarias-client';

export const metadata: Metadata = {
  title: 'Diárias e Passagens | Portal da Transparência',
  description: 'Diárias e passagens concedidas pela administração pública municipal de Bandeirantes MS',
};

export default function DiariasPage() {
  return (
    <DashboardLayout>
      <DiariasClient />
    </DashboardLayout>
  );
}
