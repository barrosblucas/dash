import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import SecretariaDetailClient from './secretaria-detail-client';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params: _params }: Props): Promise<Metadata> {
  return {
    title: `Secretaria`,
    description: 'Informações institucionais, missão, visão e contatos.',
  };
}

export default function SecretariaDetailPage({ params }: Props) {
  return (
    <DashboardLayout>
      <SecretariaDetailClient slug={params.slug} />
    </DashboardLayout>
  );
}
