import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import PrefeituraClient from './prefeitura-client';

export const metadata: Metadata = {
  title: 'Prefeitura Municipal',
  description: 'Conheça a estrutura administrativa, a gestão atual, as secretarias e os canais de atendimento da prefeitura.',
};

export default function PrefeituraPage() {
  return (
    <DashboardLayout>
      <PrefeituraClient />
    </DashboardLayout>
  );
}
