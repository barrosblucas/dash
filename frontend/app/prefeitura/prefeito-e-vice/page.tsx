import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import PrefeitoViceClient from './prefeito-vice-client';

export const metadata: Metadata = {
  title: 'Prefeito e Vice',
  description: 'Conheça os gestores eleitos que conduzem a administração pública do município.',
};

export default function PrefeitoVicePage() {
  return (
    <DashboardLayout>
      <PrefeitoViceClient />
    </DashboardLayout>
  );
}
