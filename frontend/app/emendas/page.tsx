import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import EmendasClient from './emendas-client';

export const metadata: Metadata = {
  title: 'Emendas Parlamentares | Portal da Transparencia',
  description: 'Consultar as emendas parlamentares do municipio de Bandeirantes MS',
};

export default function EmendasPage() {
  return (
    <DashboardLayout>
      <EmendasClient />
    </DashboardLayout>
  );
}
