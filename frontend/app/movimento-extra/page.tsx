import type { Metadata } from 'next';

import MovimentoExtraClient from './movimento-extra-client';

export const metadata: Metadata = {
  title: 'Movimento Extra Orçamentário | Portal da Transparência',
  description: 'Acompanhe as movimentações financeiras extraordinárias do município de Bandeirantes MS. Receitas e despesas por fundo municipal.',
};

export default function MovimentoExtraPage() {
  return <MovimentoExtraClient />;
}
