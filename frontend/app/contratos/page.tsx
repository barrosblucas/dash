import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Gestão de Contratos',
  description: 'Contratos firmados pela administração pública municipal de Bandeirantes MS',
};

export default function ContratosPage() {
  return (
    <PlaceholderPage
      title="Gestão de Contratos"
      description="Esta seção permitirá consultar os contratos firmados pela administração pública municipal. Está em desenvolvimento e estará disponível em breve."
      iconName="FileText"
    />
  );
}
