import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import PerfilEpidemiologicoClient from './perfil-epidemiologico-client';

export const metadata: Metadata = {
  title: 'Saúde | Perfil epidemiológico',
  description: 'Contadores epidemiológicos com tendência opcional e distribuição por sexo.',
};

export default function PerfilEpidemiologicoPage() {
  return (
    <DashboardLayout>
      <PerfilEpidemiologicoClient />
    </DashboardLayout>
  );
}
