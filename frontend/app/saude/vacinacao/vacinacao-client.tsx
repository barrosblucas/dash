'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { getSaudePeriodRange, getYearFromDateInput, getTopLabel, maxDate, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const MIN_START_DATE = '2020-01-01';
const currentYear = new Date().getFullYear();
const VACINACAO_YEARS = saudeYearOptions.filter((y) => y >= 2020 && y <= currentYear);
const chartColors = ['#0f4c81', '#22c55e', '#06b6d4', '#f59e0b', '#a855f7'];
const defaultPeriod = getSaudePeriodRange(VACINACAO_YEARS[0]);

export default function VacinacaoClient() {
  const [year, setYear] = useState(VACINACAO_YEARS[0]);
  const [startDate, setStartDate] = useState(maxDate(defaultPeriod.startDate, MIN_START_DATE));
  const [endDate, setEndDate] = useState(defaultPeriod.endDate);

  const handleYearChange = (nextYear: number) => {
    setYear(nextYear);
    const period = getSaudePeriodRange(nextYear);
    setStartDate(maxDate(period.startDate, MIN_START_DATE));
    setEndDate(period.endDate);
  };

  const handleStartDateChange = (date: string) => {
    const clamped = maxDate(date, MIN_START_DATE);
    setStartDate(clamped);
    const nextYear = getYearFromDateInput(clamped);
    if (nextYear !== null) {
      setYear(nextYear);
    }
  };

  const vaccinationQuery = useQuery({
    queryKey: ['saude', 'vacinacao', year, startDate, endDate],
    placeholderData: keepPreviousData,
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
        eyebrow="Imunização"
        title="Cobertura vacinal do município"
        description="Série mensal de vacinas aplicadas, ranking do período e total anual para leitura rápida da cobertura."
        badgeValue={<SaudeSyncBadge value={vaccinationQuery.data?.last_synced_at} />}
        actions={
          <SaudePeriodFilter
            year={year}
            startDate={startDate}
            endDate={endDate}
            onYearChange={handleYearChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={setEndDate}
            yearOptions={VACINACAO_YEARS}
            minStartDate={MIN_START_DATE}
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
