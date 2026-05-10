import type { Metadata } from 'next';

import AcoesListPage from '@/components/admin/management-actions/AcoesListPage';

export const metadata: Metadata = {
  title: 'Admin | Ações da Gestão',
};

export default function Page() {
  return <AcoesListPage />;
}
