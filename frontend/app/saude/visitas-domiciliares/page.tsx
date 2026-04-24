import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import VisitasDomiciliaresClient from './visitas-domiciliares-client';

export const metadata: Metadata = {
  title: 'Saúde | Visitas domiciliares',
  description: 'Estatísticas de visitas domiciliares, acompanhamento, busca ativa e controle vetorial.',
};

export default function VisitasDomiciliaresPage() {
  return (
    <DashboardLayout>
      <VisitasDomiciliaresClient />
    </DashboardLayout>
  );
}
