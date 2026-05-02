import type { Metadata } from 'next';

import LegislacaoMunicipalAdminClient from './legislacao-municipal-admin-client';

export const metadata: Metadata = {
  title: 'Admin | Legislação Municipal',
  description: 'Busca e download de matérias legislativas individuais do Diário Oficial MS.',
};

export default function LegislacaoMunicipalAdminPage() {
  return <LegislacaoMunicipalAdminClient />;
}
