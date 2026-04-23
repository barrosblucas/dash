import type { Metadata } from 'next';

import UserForm from '@/components/admin/users/UserForm';

export const metadata: Metadata = {
  title: 'Admin | Editar usuário',
};

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  return <UserForm userId={params.id} />;
}
