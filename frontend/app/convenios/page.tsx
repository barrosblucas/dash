import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ConveniosClient from './convenios-client';

export const metadata: Metadata = {
  title: 'Gestao de Convenios | Portal da Transparencia',
  description:
    'Consultar os convenios firmados pela administracao publica municipal de Bandeirantes MS',
};

export default function ConveniosPage() {
  return (
    <DashboardLayout>
      <ConveniosClient />
    </DashboardLayout>
  );
}
