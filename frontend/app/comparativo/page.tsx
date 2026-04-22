import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ComparativoClient from './comparativo-client';

export const metadata: Metadata = {
  title: 'Comparativo Anual',
  description: 'Análise comparativa financeira do município de Bandeirantes MS',
};

export default function ComparativoPage() {
  return (
    <DashboardLayout>
      <ComparativoClient />
    </DashboardLayout>
  );
}
