import type { Metadata } from 'next';

import PlaceholderPage from '@/components/portal/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Diárias e Passagens',
  description: 'Diárias e passagens concedidas pela administração de Bandeirantes MS',
};

export default function DiariasPage() {
  return (
    <PlaceholderPage
      title="Diárias e Passagens"
      description="Esta seção permitirá consultar as diárias e passagens concedidas pela administração. Está em desenvolvimento e estará disponível em breve."
      iconName="Plane"
    />
  );
}
