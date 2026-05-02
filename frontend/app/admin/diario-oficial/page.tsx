import type { Metadata } from 'next';

import DiarioOficialAdminClient from './diario-oficial-admin-client';

export const metadata: Metadata = {
  title: 'Admin | Diário Oficial',
  description: 'Busca e importação de publicações do Diário Oficial MS.',
};

export default function DiarioOficialAdminPage() {
  return <DiarioOficialAdminClient />;
}
