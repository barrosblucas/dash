'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatDateInputValue } from '@/lib/saude-utils';
import { formatNumber, getChartColor } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';
import type { SaudeLabelValueItem } from '@/types/saude';

const chartSections: Array<{ key: 'motives' | 'follow_up' | 'active_search' | 'vector_control'; title: string; description: string }> =
  [
    {
      key: 'motives',
      title: 'Motivos da visita',
      description: 'Razões mais frequentes para as equipes irem ao território.',
    },
    {
      key: 'follow_up',
      title: 'Acompanhamento',
      description: 'Recortes de acompanhamento contínuo e monitoramento familiar.',
    },
    {
      key: 'active_search',
      title: 'Busca ativa',
      description: 'Ações proativas de localização e retomada de acompanhamento.',
    },
    {
      key: 'vector_control',
      title: 'Controle vetorial',
      description: 'Ocorrências ligadas ao ambiente e prevenção de vetores.',
    },
  ];

const currentYear = new Date().getFullYear();

export default function VisitasDomiciliaresClient() {
  const [startDate, setStartDate] = useState(formatDateInputValue(new Date(currentYear, 0, 1)));
  const [endDate, setEndDate] = useState(formatDateInputValue(new Date()));

  const visitsQuery = useQuery({
    queryKey: ['saude', 'visitas-domiciliares', startDate, endDate],
    placeholderData: keepPreviousData,
    queryFn: () =>
      saudeService.getHomeVisitsDashboard({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  if (visitsQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando visitas domiciliares..." />;
  }

  if (visitsQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar visitas" description={visitsQuery.error.message} />;
  }

  const totals = chartSections.map((section) =>
    (visitsQuery.data?.[section.key] ?? []).reduce((sum, item) => sum + item.value, 0)
  );

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="Atenção territorial"
        title="Visitas domiciliares e atenção territorial"
        description="Quatro blocos independentes mostram os principais motivos de visita e os recortes assistenciais enviados pela fonte externa."
        badgeValue={<SaudeSyncBadge value={visitsQuery.data?.last_synced_at} />}
        actions={
          <SaudePeriodFilter
            year={currentYear}
            startDate={startDate}
            endDate={endDate}
            onYearChange={() => {}}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            showYear={false}
          />
        }
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {chartSections.map((section, index) => (
          <SaudeMetricCard
            key={section.key}
            label={section.title}
            value={formatNumber(totals[index] ?? 0, { decimals: 0 })}
            supportingText={section.description}
            icon="home_health"
            tone={index % 2 === 0 ? 'success' : 'info'}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {chartSections.map((section) => (
          <SaudePanel key={section.key} title={section.title} description={section.description}>
            <ChartBlock items={visitsQuery.data?.[section.key] ?? []} />
          </SaudePanel>
        ))}
      </section>
    </div>
  );
}

function ChartBlock({ items }: { items: SaudeLabelValueItem[] }) {
  if (!items.length) {
    return (
      <SaudeStateBlock
        type="empty"
        title="Sem dados para este bloco"
        description="A fonte externa não retornou informações para este recorte."
      />
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fill: 'currentColor', fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 10, 10, 0]}>
            {items.map((entry, index) => (
              <Cell key={entry.label} fill={getChartColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
