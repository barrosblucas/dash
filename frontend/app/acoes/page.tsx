import type { Metadata } from 'next';

import AcoesClient from './acoes-client';

export const metadata: Metadata = {
  title: 'Painel de Dados — Ações da Gestão',
  description:
    'Dashboard dinâmico com dados e indicadores das ações da Prefeitura de Bandeirantes MS.',
};

export default function AcoesPage() {
  return <AcoesClient />;
}
