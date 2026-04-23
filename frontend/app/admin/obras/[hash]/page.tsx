import type { Metadata } from 'next';

import ObraForm from '@/components/admin/obras/ObraForm';

export const metadata: Metadata = {
  title: 'Admin | Editar obra',
};

export default function AdminObraDetailPage({ params }: { params: { hash: string } }) {
  return <ObraForm obraHash={params.hash} />;
}
