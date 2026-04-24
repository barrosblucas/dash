'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatDateInputValue, getTopLabel, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const chartColors = ['#0f4c81', '#22c55e', '#06b6d4', '#f59e0b', '#a855f7'];
const currentYear = new Date().getFullYear();

export default function VacinacaoClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [startDate, setStartDate] = useState(formatDateInputValue(new Date(saudeYearOptions[0], 0, 1)));
  const [endDate, setEndDate] = useState(
    saudeYearOptions[0] === currentYear
      ? formatDateInputValue(new Date())
      : formatDateInputValue(new Date(saudeYearOptions[0], 11, 31))
  );

  const vaccinationQuery = useQuery({
    queryKey: ['saude', 'vacinacao', year, startDate, endDate],
    queryFn: () =>
      saudeService.getVaccinationDashboard({
        year,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  if (vaccinationQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando painel de vacinação..." />;
  }

  if (vaccinationQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar vacinação" description={vaccinationQuery.error.message} />;
  }

  const topApplied = vaccinationQuery.data?.top_applied ?? [];

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="US-03"
        title="Cobertura vacinal do município"
        description="Série mensal de vacinas aplicadas, ranking do período e total anual para leitura rápida da cobertura."
        badgeValue={<SaudeSyncBadge value={vaccinationQuery.data?.last_synced_at} />}
        actions={
          <SaudePeriodFilter
            year={year}
            startDate={startDate}
            endDate={endDate}
            onYearChange={setYear}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        }
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-3">
        <SaudeMetricCard
          label="Total do período"
          value={formatNumber(vaccinationQuery.data?.total_applied ?? 0, { decimals: 0 })}
          supportingText={`Consolidado entre ${startDate} e ${endDate}.`}
          tone="success"
          icon="immunology"
        />
        <SaudeMetricCard
          label="Vacina líder no período"
          value={getTopLabel(topApplied)}
          supportingText="Item com maior volume registrado."
          icon="leaderboard"
        />
        <SaudeMetricCard
          label="Itens no ranking"
          value={formatNumber(topApplied.length, { decimals: 0 })}
          supportingText="Volume de vacinas listadas pela fonte."
          icon="dataset"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Vacinas aplicadas por mês" description="Leitura mensal da aplicação para comparar intensidade ao longo do ano.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vaccinationQuery.data?.applied_by_month ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0f4c81" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>

        <SaudePanel title="Vacinas mais aplicadas" description="Ranking do período para identificar os imunizantes com maior volume.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topApplied} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={180} tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {topApplied.map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>
      </div>
    </div>
  );
}
