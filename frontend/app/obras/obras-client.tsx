'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { formatCurrency, formatDate, obraStatusLabels, obraStatusTone } from '@/lib/obra-formatters';
import { obrasService } from '@/services/obra-service';
import type { ObraStatus } from '@/types/obra';

const filters: Array<{ key: 'todas' | ObraStatus; label: string }> = [
  { key: 'todas', label: 'Todas' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'paralisada', label: 'Paralisadas' },
  { key: 'concluida', label: 'Concluídas' },
];

export default function ObrasClient() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]['key']>('todas');
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'obras', activeFilter],
    queryFn: () => obrasService.list(activeFilter === 'todas' ? undefined : activeFilter),
  });

  const obras = useMemo(() => data?.obras ?? [], [data?.obras]);
  const filteredObras = useMemo(
    () => (activeFilter === 'todas' ? obras : obras.filter((obra) => obra.status === activeFilter)),
    [activeFilter, obras]
  );

  const totalInvestimento = useMemo(
    () => obras.reduce((sum, obra) => sum + (obra.valor_homologado ?? obra.valor_original ?? 0), 0),
    [obras]
  );

  const stats = [
    { icon: 'apartment', label: 'Total obras', value: obras.length.toString() },
    {
      icon: 'engineering',
      label: 'Em andamento',
      value: obras.filter((obra) => obra.status === 'em_andamento').length.toString(),
    },
    {
      icon: 'pause_circle',
      label: 'Paralisadas',
      value: obras.filter((obra) => obra.status === 'paralisada').length.toString(),
    },
    { icon: 'account_balance_wallet', label: 'Investimento total', value: formatCurrency(totalInvestimento) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-primary md:text-4xl">Obras Públicas</h1>
        <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
          Acompanhe o andamento, contratos e medições das obras cadastradas no portal.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeFilter === filter.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
            <span className="material-symbols-outlined text-secondary">{stat.icon}</span>
            <p className="mt-3 font-headline text-2xl font-extrabold text-primary">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-on-surface-variant">Carregando obras...</p> : null}
      {error instanceof Error ? <p className="text-sm text-red-300">{error.message}</p> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredObras.map((obra) => (
          <Link
            key={obra.hash}
            href={`/obras/${obra.hash}`}
            className="group overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient transition hover:-translate-y-1"
          >
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <span className="material-symbols-outlined text-6xl text-primary/30">construction</span>
            </div>

            <div className="space-y-4 p-6">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${obraStatusTone[obra.status]}`}>
                {obraStatusLabels[obra.status]}
              </span>

              <div>
                <h3 className="font-headline text-lg font-bold text-primary line-clamp-2">{obra.titulo}</h3>
                <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{obra.descricao}</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Progresso físico</span>
                  <span>{obra.progresso_fisico ?? 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    style={{ width: `${obra.progresso_fisico ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-on-surface-variant">
                <p>Secretaria: {obra.secretaria}</p>
                <p>Início: {formatDate(obra.data_inicio)}</p>
                <p>Valor homologado: {formatCurrency(obra.valor_homologado)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
