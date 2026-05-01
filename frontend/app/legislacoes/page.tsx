import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import LegislacoesClient from './legislacoes-client';

export const metadata: Metadata = {
  title: 'Legislações Municipais',
  description: 'Consulte leis, decretos, portarias e demais atos normativos do município de Bandeirantes MS.',
};

export default function LegislacoesPage() {
  return (
    <DashboardLayout>
      <LegislacoesClient />
    </DashboardLayout>
  );
}
