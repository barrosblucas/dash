'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

export default function FarmaciaClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);

  const pharmacyQuery = useQuery({
    queryKey: ['saude', 'farmacia', year],
    queryFn: () => saudeService.getPharmacyDashboard(year),
  });

  if (pharmacyQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando dados da farmácia..." />;
  }

  if (pharmacyQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar farmácia" description={pharmacyQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="US-10"
        title="Histórico de atendimentos da farmácia"
        description="Painel separado do estoque para comparar atendimentos de medicamentos e dispensações mensais."
        badgeValue={<SaudeSyncBadge value={pharmacyQuery.data?.last_synced_at} />}
        actions={
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
    </div>
  );
}
