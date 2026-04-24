'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { getSaudePeriodRange, getYearFromDateInput, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const defaultPeriod = getSaudePeriodRange(saudeYearOptions[0]);

export default function FarmaciaClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [startDate, setStartDate] = useState(defaultPeriod.startDate);
  const [endDate, setEndDate] = useState(defaultPeriod.endDate);

  const handleYearChange = (nextYear: number) => {
    setYear(nextYear);
    const period = getSaudePeriodRange(nextYear);
    setStartDate(period.startDate);
    setEndDate(period.endDate);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    const nextYear = getYearFromDateInput(date);
    if (nextYear !== null) {
      setYear(nextYear);
    }
  };

  const pharmacyQuery = useQuery({
    queryKey: ['saude', 'farmacia', year, startDate, endDate],
    placeholderData: keepPreviousData,
    queryFn: () =>
      saudeService.getPharmacyDashboard({
        year,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  if (pharmacyQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando dados da farmácia..." />;
  }

  if (pharmacyQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar farmácia" description={pharmacyQuery.error.message} />;
  }

  const topMedicamentos = pharmacyQuery.data?.top_medicamentos ?? [];
  const totalTopMedicamentos = topMedicamentos.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="Atendimentos farmacêuticos"
        title="Histórico de atendimentos da farmácia"
        description="Painel separado do estoque para comparar atendimentos de medicamentos e dispensações mensais."
        badgeValue={<SaudeSyncBadge value={pharmacyQuery.data?.last_synced_at} />}
        actions={
          <SaudePeriodFilter
            year={year}
            startDate={startDate}
            endDate={endDate}
            onYearChange={handleYearChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={setEndDate}
          />
        }
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-2">
        <SaudeMetricCard
          label={`Atendimentos em ${year}`}
          value={formatNumber(pharmacyQuery.data?.total_attendances ?? 0, { decimals: 0 })}
          supportingText="Total consolidado de atendimentos de medicamentos."
          tone="success"
          icon="support_agent"
        />
        <SaudeMetricCard
          label={`Dispensações em ${year}`}
          value={formatNumber(pharmacyQuery.data?.total_dispensed ?? 0, { decimals: 0 })}
          supportingText="Total consolidado de medicamentos dispensados."
          tone="info"
          icon="medication_liquid"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Atendimentos de medicamentos por mês" description="Linha mensal para entender a demanda assistencial na farmácia.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pharmacyQuery.data?.attendances_by_month ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f4c81" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>

        <SaudePanel title="Medicamentos dispensados por mês" description="Barras mensais para comparar o volume efetivamente dispensado.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pharmacyQuery.data?.dispensed_by_month ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SaudePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Medicamentos com mais saídas" description="TOP 10 medicamentos com maior volume de dispensação no período.">
          <div className="space-y-4">
            {topMedicamentos.slice(0, 10).map((item) => {
              const percent =
                totalTopMedicamentos > 0 ? (item.value / totalTopMedicamentos) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-on-surface">{item.label}</span>
                    <span className="text-on-surface-variant">
                      {formatNumber(item.value, { decimals: 0 })} ({formatNumber(percent, { decimals: 1 })}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topMedicamentos.length === 0 && (
              <SaudeStateBlock type="empty" title="Sem dados de medicamentos" />
            )}
          </div>
        </SaudePanel>
      </section>
    </div>
  );
}
