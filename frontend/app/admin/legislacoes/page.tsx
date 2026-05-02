import type { Metadata } from 'next';

import LegislacoesListPage from '@/components/admin/legislacoes/LegislacoesListPage';

export const metadata: Metadata = {
  title: 'Admin | Legislações',
  description: 'Gestão administrativa de legislações municipais.',
};

export default function AdminLegislacoesPage() {
  return <LegislacoesListPage />;
}
