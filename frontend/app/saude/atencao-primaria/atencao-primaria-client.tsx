'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatDateInputValue, getTopLabel, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

export default function AtencaoPrimariaClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [startDate, setStartDate] = useState(formatDateInputValue(new Date(saudeYearOptions[0], 0, 1)));

  useEffect(() => {
    setStartDate(formatDateInputValue(new Date(year, 0, 1)));
  }, [year]);

  const primaryCareQuery = useQuery({
    queryKey: ['saude', 'atencao-primaria', year, startDate],
    queryFn: () => saudeService.getPrimaryCareDashboard({ year, start_date: startDate || undefined }),
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
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            >
              {saudeYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
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
