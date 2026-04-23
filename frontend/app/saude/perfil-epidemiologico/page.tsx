import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import PerfilEpidemiologicoClient from './perfil-epidemiologico-client';

export const metadata: Metadata = {
  title: 'Saúde | Perfil epidemiológico',
  description: 'Perfil epidemiológico e demográfico do atendimento municipal.',
};

export default function PerfilEpidemiologicoPage() {
  return (
    <DashboardLayout>
      <PerfilEpidemiologicoClient />
    </DashboardLayout>
  );
}
