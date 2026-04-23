import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import SaudeClient from './saude-client';

export const metadata: Metadata = {
  title: 'Saúde Transparente',
  description: 'Indicadores públicos, estoque de medicamentos, procedimentos e unidades de saúde.',
};

export default function SaudePage() {
  return (
    <DashboardLayout>
      <SaudeClient />
    </DashboardLayout>
  );
}
