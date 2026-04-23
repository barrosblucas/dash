import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import UnidadesClient from './unidades-client';

export const metadata: Metadata = {
  title: 'Saúde | Unidades',
  description: 'Mapa e listagem pública das unidades de saúde.',
};

export default function UnidadesPage() {
  return (
    <DashboardLayout>
      <UnidadesClient />
    </DashboardLayout>
  );
}
