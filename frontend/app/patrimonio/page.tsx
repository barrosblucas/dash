import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import PatrimonioClient from './patrimonio-client';

export const metadata: Metadata = {
  title: 'Controle Patrimonial | Portal da Transparencia',
  description: 'Consultar o patrimonio publico municipal de Bandeirantes MS',
};

export default function PatrimonioPage() {
  return (
    <DashboardLayout>
      <PatrimonioClient />
    </DashboardLayout>
  );
}
