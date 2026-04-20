import type { Metadata } from 'next';

import PortalClient from './portal-client';

export const metadata: Metadata = {
  title: 'Portal da Transparência',
  description:
    'Portal da Transparência — Prefeitura Municipal de Bandeirantes MS. Acesse informações sobre receitas, despesas, licitações, obras e gestão pública.',
};

export default function PortalPage() {
  return <PortalClient />;
}
