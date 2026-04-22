import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import AvisosLicitacoesClient from './avisos-licitacoes-client';

export const metadata: Metadata = {
  title: 'Aviso de Licitações',
  description: 'Avisos e editais de processos licitatórios em andamento de Bandeirantes MS',
};

export default function AvisosLicitacoesPage() {
  return (
    <DashboardLayout>
      <AvisosLicitacoesClient />
    </DashboardLayout>
  );
}
