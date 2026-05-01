import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import LegislacaoDetailClient from './legislacao-detail-client';

export const metadata: Metadata = {
  title: 'Detalhe da Legislação',
  description: 'Consulte o texto integral e informações completas da legislação municipal.',
};

export default function LegislacaoDetalhePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <LegislacaoDetailClient id={params.id} />
    </DashboardLayout>
  );
}
