import type { Metadata } from 'next';
import DespesasClient from './despesas-client';

export const metadata: Metadata = {
  title: 'Despesas Municipais',
  description: 'Análise detalhada das despesas municipais de Bandeirantes MS',
};

export default function DespesasPage() {
  return <DespesasClient />;
}
