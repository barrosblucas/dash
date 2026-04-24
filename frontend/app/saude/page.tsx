import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import SaudeClient from './saude-client';

export const metadata: Metadata = {
  title: 'Saúde Transparente',
  description: 'Painéis públicos de vacinação, farmácia, hospital, atenção primária e demais recortes da rede de saúde.',
};

export default function SaudePage() {
  return (
    <DashboardLayout>
      <SaudeClient />
    </DashboardLayout>
  );
}
