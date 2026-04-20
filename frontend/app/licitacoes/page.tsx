import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Licitações',
  description: 'Processos licitatórios do município de Bandeirantes MS',
};

export default function LicitacoesPage() {
  return (
    <PlaceholderPage
      title="Licitações"
      description="Esta seção permitirá acompanhar os processos licitatórios do município. Está em desenvolvimento e estará disponível em breve."
      iconName="Gavel"
    />
  );
}
