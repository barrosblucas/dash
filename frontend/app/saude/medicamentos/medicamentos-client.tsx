'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { saudeYearOptions, getLatestSync } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const PAGE_SIZE = 10;

export default function MedicamentosClient() {
  const [search, setSearch] = useState('');
  const [estabelecimento, setEstabelecimento] = useState('');
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [page, setPage] = useState(1);

  const stockQuery = useQuery({
    queryKey: ['saude', 'medication-stock', search, estabelecimento, page],
    queryFn: () =>
      saudeService.getMedicationStock({
        search: search || undefined,
        estabelecimento: estabelecimento || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const dispensedQuery = useQuery({
    queryKey: ['saude', 'medication-dispensed', year],
    queryFn: () => saudeService.getDispensedMedications(year),
  });

  const latestSync = getLatestSync(stockQuery.data?.last_synced_at, dispensedQuery.data?.last_synced_at);
  const totalPages = stockQuery.data ? Math.max(1, Math.ceil(stockQuery.data.total / stockQuery.data.page_size)) : 1;
  const totalDispensed = useMemo(
    () => dispensedQuery.data?.series_mensal_dispensacao.reduce((sum, item) => sum + item.value, 0) ?? 0,
    [dispensedQuery.data?.series_mensal_dispensacao]
  );

  if (stockQuery.isLoading && dispensedQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando medicamentos..." />;
  }

  if (stockQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar estoque" description={stockQuery.error.message} />;
  }

  if (dispensedQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar dispensação" description={dispensedQuery.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary">Medicamentos</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Estoque público por estabelecimento, com destaque para itens abaixo do mínimo e ranking de dispensação.
          </p>
        </div>
        <SaudeSyncBadge value={latestSync} />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Itens filtrados" value={formatNumber(stockQuery.data?.total ?? 0, { decimals: 0 })} />
        <StatCard label="Abaixo do mínimo" value={formatNumber(stockQuery.data?.total_abaixo_minimo ?? 0, { decimals: 0 })} tone="warning" />
        <StatCard label="Mais dispensado" value={dispensedQuery.data?.ranking[0]?.label ?? 'Sem dados'} />
        <StatCard label={`Dispensação ${year}`} value={formatNumber(totalDispensed, { decimals: 0 })} />
      </section>

      <section className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar medicamento"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <input
            value={estabelecimento}
            onChange={(event) => {
              setEstabelecimento(event.target.value);
              setPage(1);
            }}
            placeholder="Filtrar por estabelecimento"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            {saudeYearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setEstabelecimento('');
              setPage(1);
            }}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Ranking de medicamentos dispensados">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dispensedQuery.data?.ranking ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f4c81" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Série mensal de dispensação x atendimentos">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={(dispensedQuery.data?.series_mensal_dispensacao ?? []).map((item, index) => ({
                label: item.label,
                dispensacao: item.value,
                atendimentos: dispensedQuery.data?.series_mensal_atendimentos[index]?.value ?? 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="dispensacao" stroke="#0f4c81" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="atendimentos" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Medicamento</span>
          <span>Estoque</span>
          <span>Mínimo</span>
          <span>Estabelecimento</span>
        </div>
        {stockQuery.data?.items.length ? (
          stockQuery.data.items.map((item) => (
            <div
              key={`${item.product_name}-${item.establishment}`}
              className={`grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] gap-4 border-t border-outline/10 px-6 py-4 text-sm ${
                item.below_minimum ? 'bg-red-500/5' : 'bg-transparent'
              }`}
            >
              <div>
                <p className="font-semibold text-primary">{item.product_name}</p>
                <p className="text-xs text-on-surface-variant">{item.department ?? 'Departamento não informado'}</p>
              </div>
              <p className={item.below_minimum ? 'font-bold text-red-300' : 'text-on-surface'}>{item.in_stock}</p>
              <p className="text-on-surface">{item.minimum_stock ?? '-'}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-on-surface">{item.establishment ?? '-'}</p>
                {item.below_minimum ? (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300">Abaixo</span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6">
            <SaudeStateBlock type="empty" title="Nenhum medicamento encontrado" />
          </div>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-outline/10 px-6 py-4 text-sm text-on-surface-variant">
          <p>Página {stockQuery.data?.page ?? 1} de {totalPages}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl bg-surface-container-lowest px-3 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-xl bg-surface-container-lowest px-3 py-2 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' }) {
  return (
    <div className="rounded-3xl bg-surface-container-low p-5 shadow-ambient">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className={`mt-2 font-headline text-2xl font-bold ${tone === 'warning' ? 'text-red-300' : 'text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
      <h2 className="font-headline text-xl font-bold text-primary">{title}</h2>
      <div className="mt-5 h-[280px] text-on-surface-variant">{children}</div>
    </div>
  );
}
