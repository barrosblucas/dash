import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Aviso de Licitações',
  description: 'Avisos e editais de processos licitatórios em andamento de Bandeirantes MS',
};

export default function AvisosLicitacoesPage() {
  return (
    <PlaceholderPage
      title="Aviso de Licitações"
      description="Esta seção permitirá consultar avisos e editais de processos licitatórios em andamento. Está em desenvolvimento e estará disponível em breve."
      iconName="BellRing"
    />
  );
}
