import type { Metadata } from 'next';

import UsersListPage from '@/components/admin/users/UsersListPage';

export const metadata: Metadata = {
  title: 'Admin | Usuários',
  description: 'Gestão administrativa de usuários.',
};

export default function AdminUsersPage() {
  return <UsersListPage />;
}
