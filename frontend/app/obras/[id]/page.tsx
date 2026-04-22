import DashboardLayout from '@/components/layouts/DashboardLayout';

import ObraDetalheClient from './obra-detalhe-client';

export const metadata = { title: 'Detalhes da Obra' };

export default function ObraDetalhePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <ObraDetalheClient id={params.id} />
    </DashboardLayout>
  );
}
