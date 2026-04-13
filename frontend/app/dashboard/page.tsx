import { Metadata } from 'next';

import DashboardClient from './dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visão geral das finanças municipais de Bandeirantes MS',
};

export default function DashboardPage() {
  return <DashboardClient />;
}