import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import GabineteClient from './gabinete-client';

export const metadata: Metadata = {
  title: 'Gabinete do Prefeito',
  description: 'Conheça a equipe de assessoria direta e a função do gabinete na coordenação das ações de governo.',
};

export default function GabinetePage() {
  return (
    <DashboardLayout>
      <GabineteClient />
    </DashboardLayout>
  );
}
