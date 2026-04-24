import type { Metadata } from 'next';

import DashboardLayout from '@/components/layouts/DashboardLayout';

import HospitalClient from './hospital-client';

export const metadata: Metadata = {
  title: 'Saúde | Hospital',
  description: 'Leitos, internações, permanência e procedimentos hospitalares.',
};

export default function HospitalPage() {
  return (
    <DashboardLayout>
      <HospitalClient />
    </DashboardLayout>
  );
}
