import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Acompanhamento de Obras',
  description: 'Obras e projetos de infraestrutura do município de Bandeirantes MS',
};

export default function ObrasPage() {
  return (
    <PlaceholderPage
      title="Acompanhamento de Obras"
      description="Esta seção permitirá acompanhar as obras e projetos de infraestrutura do município. Está em desenvolvimento e estará disponível em breve."
      iconName="Building2"
    />
  );
}
