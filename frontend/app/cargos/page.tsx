import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import CargosClient from './cargos-client';

export const metadata: Metadata = {
  title: 'Cargos e Salários | Portal da Transparência',
  description: 'Consultar os cargos e salários do funcionalismo público municipal de Bandeirantes MS',
};

export default function CargosPage() {
  return (
    <DashboardLayout>
      <CargosClient />
    </DashboardLayout>
  );
}
