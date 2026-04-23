import type { Metadata } from 'next';

import SaudeUnitsAdminPage from '@/components/admin/saude/SaudeUnitsAdminPage';

export const metadata: Metadata = {
  title: 'Admin | Saúde | Unidades',
  description: 'Gestão administrativa das unidades de saúde.',
};

export default function AdminSaudeUnitsPage() {
  return <SaudeUnitsAdminPage />;
}
