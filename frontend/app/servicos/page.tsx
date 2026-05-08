import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Serviços',
  description: 'Serviços públicos e utilidades do município de Bandeirantes MS',
};

export default function ServicosPage() {
  return (
    <PlaceholderPage
      title="Serviços"
      description="Esta seção reunirá serviços públicos e utilidades para o cidadão. Está em desenvolvimento e estará disponível em breve."
      iconName="handyman"
    />
  );
}
