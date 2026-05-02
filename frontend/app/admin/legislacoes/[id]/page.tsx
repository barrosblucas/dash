import type { Metadata } from 'next';

import LegislacaoForm from '@/components/admin/legislacoes/LegislacaoForm';

export const metadata: Metadata = {
  title: 'Admin | Editar legislação',
};

export default function AdminEditLegislacaoPage({ params }: { params: { id: string } }) {
  return <LegislacaoForm legislacaoId={params.id} />;
}
