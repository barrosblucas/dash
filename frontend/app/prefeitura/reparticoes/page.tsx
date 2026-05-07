import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import ReparticoesClient from './reparticoes-client';

export const metadata: Metadata = {
  title: 'Repartições e Setores',
  description: 'Endereços, telefones e informações de localização dos setores e repartições municipais.',
};

export default function ReparticoesPage() {
  return (
    <DashboardLayout>
      <ReparticoesClient />
    </DashboardLayout>
  );
}
