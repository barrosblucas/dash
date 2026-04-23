'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { getLatestSync, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const chartColors = ['#0f4c81', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4'];

export default function PerfilEpidemiologicoClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const epidemiologicalQuery = useQuery({
    queryKey: ['saude', 'epidemiological-profile'],
    queryFn: saudeService.getEpidemiologicalProfile,
  });
  const demographicQuery = useQuery({
    queryKey: ['saude', 'demographic-profile', year],
    queryFn: () => saudeService.getDemographicProfile(year),
  });

  if (epidemiologicalQuery.isLoading && demographicQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando perfil epidemiológico..." />;
  }

  if (epidemiologicalQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar quantitativos" description={epidemiologicalQuery.error.message} />;
  }

  if (demographicQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar perfil demográfico" description={demographicQuery.error.message} />;
  }

  const latestSync = getLatestSync(
    epidemiologicalQuery.data?.last_synced_at,
    demographicQuery.data?.last_synced_at
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary">Perfil epidemiológico</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Quantitativos consolidados do atendimento e recorte demográfico por exercício.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            {saudeYearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <SaudeSyncBadge value={latestSync} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(epidemiologicalQuery.data?.quantitativos ?? []).map((item) => (
          <div key={item.label} className="rounded-3xl bg-surface-container-low p-5 shadow-ambient">
            <p className="text-sm text-on-surface-variant">{item.label}</p>
            <p className="mt-2 font-headline text-2xl font-bold text-primary">{formatNumber(item.value, { decimals: 0 })}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h2 className="font-headline text-xl font-bold text-primary">Distribuição por sexo</h2>
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={epidemiologicalQuery.data?.por_sexo ?? []} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110}>
                  {(epidemiologicalQuery.data?.por_sexo ?? []).map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h2 className="font-headline text-xl font-bold text-primary">Tipos de pessoa</h2>
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicQuery.data?.tipos_pessoa ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f4c81" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
        <h2 className="font-headline text-xl font-bold text-primary">Pessoas por mês ({year})</h2>
        <div className="mt-5 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demographicQuery.data?.pessoas_por_mes ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
