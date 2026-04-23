'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

export default function ProcedimentosClient() {
  const proceduresQuery = useQuery({
    queryKey: ['saude', 'procedure-types'],
    queryFn: saudeService.getProcedureTypes,
  });

  const sortedItems = useMemo(
    () => [...(proceduresQuery.data?.items ?? [])].sort((left, right) => right.value - left.value),
    [proceduresQuery.data?.items]
  );

  if (proceduresQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando procedimentos..." />;
  }

  if (proceduresQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar procedimentos" description={proceduresQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary">Procedimentos por tipo</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Distribuição consolidada dos procedimentos registrados na rede municipal.
          </p>
        </div>
        <SaudeSyncBadge value={proceduresQuery.data?.last_synced_at} />
      </div>

      <section className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedItems}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f4c81" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.5fr_0.6fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Procedimento</span>
          <span>Quantidade</span>
        </div>
        {sortedItems.length ? (
          sortedItems.map((item) => (
            <div key={item.label} className="grid grid-cols-[1.5fr_0.6fr] gap-4 border-t border-outline/10 px-6 py-4 text-sm text-on-surface">
              <p className="font-medium text-primary">{item.label}</p>
              <p>{formatNumber(item.value, { decimals: 0 })}</p>
            </div>
          ))
        ) : (
          <div className="p-6">
            <SaudeStateBlock type="empty" title="Nenhum procedimento encontrado" />
          </div>
        )}
      </section>
    </div>
  );
}
