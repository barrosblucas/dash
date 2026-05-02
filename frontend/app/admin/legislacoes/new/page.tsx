import type { Metadata } from 'next';

import LegislacaoForm from '@/components/admin/legislacoes/LegislacaoForm';

export const metadata: Metadata = {
  title: 'Admin | Nova legislação',
};

export default function AdminNewLegislacaoPage() {
  return <LegislacaoForm />;
}
