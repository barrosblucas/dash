import type { Metadata } from 'next';

import ObraForm from '@/components/admin/obras/ObraForm';

export const metadata: Metadata = {
  title: 'Admin | Nova obra',
};

export default function AdminNewObraPage() {
  return <ObraForm />;
}
