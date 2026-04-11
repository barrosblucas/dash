import type { Metadata } from 'next';
import RelatoriosClient from './relatorios-client';

export const metadata: Metadata = {
  title: 'Relatórios',
  description: 'Central de exportação de relatórios financeiros de Bandeirantes MS',
};

export default function RelatoriosPage() {
  return <RelatoriosClient />;
}
