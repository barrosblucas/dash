import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import RelatoriosClient from './relatorios-client';

export const metadata: Metadata = {
  title: 'Relatórios e Exportação',
  description: 'Central de exportação de relatórios financeiros de Bandeirantes MS',
};

export default function RelatoriosPage() {
  return (
    <DashboardLayout>
      <RelatoriosClient />
    </DashboardLayout>
  );
}
