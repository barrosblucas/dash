import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ObrasClient from './obras-client';

export const metadata: Metadata = {
  title: 'Obras Públicas',
  description: 'Acompanhamento de obras e projetos de infraestrutura do município',
};

export default function ObrasPage() {
  return (
    <DashboardLayout>
      <ObrasClient />
    </DashboardLayout>
  );
}
