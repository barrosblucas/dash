'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatDateInputValue, getTopLabel } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const currentYear = new Date().getFullYear();
const defaultYear = currentYear;

export default function AtencaoPrimariaClient() {
  const [year, setYear] = useState(defaultYear);
  const [startDate, setStartDate] = useState(formatDateInputValue(new Date(defaultYear, 0, 1)));
  const [endDate, setEndDate] = useState(
    defaultYear === currentYear
      ? formatDateInputValue(new Date())
      : formatDateInputValue(new Date(defaultYear, 11, 31))
  );

  const primaryCareQuery = useQuery({
    queryKey: ['saude', 'atencao-primaria', year, startDate, endDate],
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
        eyebrow="US-07"
        title="Atendimentos da atenção primária"
        description="Produção mensal, procedimentos por especialidade e leitura por CBO com filtro por ano e data inicial."
        badgeValue={<SaudeSyncBadge value={primaryCareQuery.data?.last_synced_at} />}
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
          label="Atendimentos no período"
          value={formatNumber(monthlyTotal, { decimals: 0 })}
          supportingText={`Série mensal filtrada para ${year}.`}
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
          label="CBO líder"
          value={getTopLabel(primaryCareQuery.data?.attendances_by_cbo ?? [])}
          supportingText="Recorte mais volumoso entre os CBOs retornados."
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
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={primaryCareQuery.data?.procedures_by_specialty ?? []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={120} tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>
      </section>

      <SaudePanel title="Atendimentos por CBO da especialidade" description="Recorte por ocupação para visualizar onde a demanda está concentrada.">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={primaryCareQuery.data?.attendances_by_cbo ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={72} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SaudePanel>
    </div>
  );
}
