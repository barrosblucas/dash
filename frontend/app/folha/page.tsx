import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import FolhaClient from './folha-client';

export const metadata: Metadata = {
  title: 'Folha de Pagamento | Portal da Transparencia',
  description:
    'Consultar a folha de pagamento dos servidores municipais de Bandeirantes MS',
};

export default function FolhaPage() {
  return (
    <DashboardLayout>
      <FolhaClient />
    </DashboardLayout>
  );
}
