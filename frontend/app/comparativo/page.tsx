import type { Metadata } from 'next';

import ComparativoClient from './comparativo-client';

export const metadata: Metadata = {
  title: 'Comparativo',
  description: 'Análise comparativa financeira do município de Bandeirantes MS',
};

export default function ComparativoPage() {
  return <ComparativoClient />;
}
