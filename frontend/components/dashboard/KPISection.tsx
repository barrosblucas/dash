'use client';

import { useQuery } from '@tanstack/react-query';
import KPICard from './KPICard';
import { QUERY_KEYS } from '@/lib/constants';
import type { DashboardSummary, KPICardData } from '@/types';

// Dados mock para desenvolvimento
const mockKPIs: KPICardData[] = [
  {
    titulo: 'Receitas Totais',
    valor: 125000000,
    tipo: 'currency',
    prefixo: 'R$ ',
    variacao: 12.5,
    variacao_tipo: 'positiva',
    periodo_comparacao: '2023',
    tendencia: 'alta',
  },
  {
    titulo: 'Despesas Totais',
    valor: 118000000,
    tipo: 'currency',
    prefixo: 'R$ ',
    variacao: 8.3,
    variacao_tipo: 'negativa',
    periodo_comparacao: '2023',
    tendencia: 'alta',
  },
  {
    titulo: 'Superávit',
    valor: 7000000,
    tipo: 'currency',
    prefixo: 'R$ ',
    variacao: 156.7,
    variacao_tipo: 'positiva',
    periodo_comparacao: '2023',
    tendencia: 'alta',
  },
  {
    titulo: 'Taxa de Execução',
    valor: 87.5,
    tipo: 'percent',
    variacao: -2.3,
    variacao_tipo: 'negativa',
    periodo_comparacao: '2023',
    tendencia: 'estavel',
  },
];

export default function KPISection() {
  // TODO: Integrar com API real
  // const { data: summary, isLoading } = useQuery<DashboardSummary>({
  //   queryKey: QUERY_KEYS.dashboard.summary(),
  // });

  return (
    <section className="stagger-children">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark-100">Visão Geral</h2>
        <p className="text-sm text-dark-400">Indicadores financeiros principais</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            data={kpi}
            size="md"
            showTrend={true}
            animated={true}
          />
        ))}
      </div>
    </section>
  );
}