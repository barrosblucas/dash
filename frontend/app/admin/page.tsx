import type { Metadata } from 'next';

import AdminHomePage from '@/components/admin/AdminHomePage';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Painel administrativo do portal.',
};

export default function AdminPage() {
  return <AdminHomePage />;
}
