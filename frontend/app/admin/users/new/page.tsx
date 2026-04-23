import type { Metadata } from 'next';

import UserForm from '@/components/admin/users/UserForm';

export const metadata: Metadata = {
  title: 'Admin | Novo usuário',
};

export default function AdminNewUserPage() {
  return <UserForm />;
}
