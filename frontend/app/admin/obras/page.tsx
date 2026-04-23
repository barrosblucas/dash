import type { Metadata } from 'next';

import ObrasListPage from '@/components/admin/obras/ObrasListPage';

export const metadata: Metadata = {
  title: 'Admin | Obras',
  description: 'Gestão administrativa de obras públicas.',
};

export default function AdminObrasPage() {
  return <ObrasListPage />;
}
