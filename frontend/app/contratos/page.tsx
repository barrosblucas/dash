import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ContratosClient from './contratos-client';

export const metadata: Metadata = {
  title: 'Gestao de Contratos | Portal da Transparencia',
  description: 'Consultar os contratos firmados pela administracao publica municipal de Bandeirantes MS',
};

export default function ContratosPage() {
  return (
    <DashboardLayout>
      <ContratosClient />
    </DashboardLayout>
  );
}
