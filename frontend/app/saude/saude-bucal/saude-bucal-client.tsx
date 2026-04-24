'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatDateInputValue, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const currentYear = new Date().getFullYear();

export default function SaudeBucalClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [startDate, setStartDate] = useState(formatDateInputValue(new Date(saudeYearOptions[0], 0, 1)));
  const [endDate, setEndDate] = useState(
    saudeYearOptions[0] === currentYear
      ? formatDateInputValue(new Date())
      : formatDateInputValue(new Date(saudeYearOptions[0], 11, 31))
  );

  const oralHealthQuery = useQuery({
    queryKey: ['saude', 'saude-bucal', year, startDate, endDate],
    queryFn: () =>
      saudeService.getOralHealthDashboard({
        year,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  if (oralHealthQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando saúde bucal..." />;
  }

  if (oralHealthQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar saúde bucal" description={oralHealthQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="US-08"
        title="Atendimentos odontológicos da rede"
        description="Série mensal focada em saúde bucal, com total consolidado do período selecionado."
        badgeValue={<SaudeSyncBadge value={oralHealthQuery.data?.last_synced_at} />}
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

      <section className="grid gap-4 md:grid-cols-2">
        <SaudeMetricCard
          label={`Atendimentos de saúde bucal em ${year}`}
          value={formatNumber(oralHealthQuery.data?.total_attendances ?? 0, { decimals: 0 })}
          supportingText="Total consolidado do período."
          tone="success"
          icon="dentistry"
        />
        <SaudeMetricCard
          label="Meses com registro"
          value={formatNumber(oralHealthQuery.data?.attendances_by_month.length ?? 0, { decimals: 0 })}
          supportingText="Meses retornados pela fonte externa."
          icon="calendar_month"
        />
      </section>

      <SaudePanel title="Atendimentos odontológicos por mês" description="Leitura em linha contínua para acompanhar a demanda ao longo do exercício.">
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={oralHealthQuery.data?.attendances_by_month ?? []}>
              <defs>
                <linearGradient id="saude-bucal-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} fill="url(#saude-bucal-gradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SaudePanel>
    </div>
  );
}
