'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
const ATENCAO_PRIMARIA_YEARS = saudeYearOptions.filter((y) => y >= 2020 && y <= currentYear);
const defaultPeriod = getSaudePeriodRange(ATENCAO_PRIMARIA_YEARS[0]);

export default function AtencaoPrimariaClient() {
  const [year, setYear] = useState(ATENCAO_PRIMARIA_YEARS[0]);
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

  const primaryCareQuery = useQuery({
    queryKey: ['saude', 'atencao-primaria', year, startDate, endDate],
    placeholderData: keepPreviousData,
    queryFn: () =>
      saudeService.getPrimaryCareDashboard({
        year,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  if (primaryCareQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando atenção primária..." />;
  }

  if (primaryCareQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar atenção primária" description={primaryCareQuery.error.message} />;
  }

  const monthlyTotal =
    primaryCareQuery.data?.attendances_by_month.reduce((sum, item) => sum + item.value, 0) ?? 0;

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="Produção assistencial"
        title="Atendimentos da atenção primária"
        description="Produção mensal, procedimentos por especialidade e leitura por CBO com filtro por ano e data inicial."
        badgeValue={<SaudeSyncBadge value={primaryCareQuery.data?.last_synced_at} />}
        actions={
          <SaudePeriodFilter
            year={year}
            startDate={startDate}
            endDate={endDate}
            onYearChange={handleYearChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={setEndDate}
            yearOptions={ATENCAO_PRIMARIA_YEARS}
            minStartDate={MIN_START_DATE}
          />
        }
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-3">
        <SaudeMetricCard
          label="Atendimentos no período"
          value={formatNumber(monthlyTotal, { decimals: 0 })}
          supportingText={`Consolidado entre ${startDate} e ${endDate}.`}
          tone="success"
          icon="stethoscope"
        />
        <SaudeMetricCard
          label="Especialidade com maior produção"
          value={getTopLabel(primaryCareQuery.data?.procedures_by_specialty ?? [])}
          supportingText="Calculada pelo ranking de procedimentos."
          icon="medical_services"
        />
        <SaudeMetricCard
          label="Categoria líder"
          value={getTopLabel(primaryCareQuery.data?.attendances_by_category ?? [])}
          supportingText="Categoria profissional com maior volume no período."
          icon="badge"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Atendimentos por especialidade ao longo do tempo" description="Série mensal para leitura do volume assistencial da atenção primária.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={primaryCareQuery.data?.attendances_by_month ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f4c81" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>

        <SaudePanel title="Procedimentos por especialidade" description="Ranking agregado para entender a carga assistencial por especialidade.">
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={primaryCareQuery.data?.procedures_by_specialty ?? []}
                layout="vertical"
                margin={{ top: 12, right: 24, bottom: 12, left: 40 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={180}
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickMargin={12}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>
      </section>

      <SaudePanel title="Atendimentos por categoria" description="Distribuição por categoria profissional (CBO) no período selecionado.">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={primaryCareQuery.data?.attendances_by_category ?? []} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis type="category" dataKey="label" width={220} tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#a855f7" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SaudePanel>
    </div>
  );
}
