'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/lib/constants';
import { legislacaoService } from '@/services/legislacao-service';
import type { LegislacaoItem, StatusLegislacao, TipoLegislacao } from '@/types/legislacao';

const tipoOptions: Array<{ value: TipoLegislacao | ''; label: string }> = [
  { value: '', label: 'Todos os tipos' },
  { value: 'LEI', label: 'Lei' },
  { value: 'LEI_COMPLEMENTAR', label: 'Lei Complementar' },
  { value: 'DECRETO', label: 'Decreto' },
  { value: 'DECRETO_LEI', label: 'Decreto-Lei' },
  { value: 'PORTARIA', label: 'Portaria' },
  { value: 'RESOLUCAO', label: 'Resolução' },
  { value: 'EMENDA', label: 'Emenda' },
];

const statusOptions: Array<{ value: StatusLegislacao | ''; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'REVOGADA', label: 'Revogada' },
  { value: 'ALTERADA', label: 'Alterada' },
];

const anos = Array.from({ length: 14 }, (_, i) => 2013 + i).reverse();

function formatTipo(tipo: TipoLegislacao): string {
  const map: Record<TipoLegislacao, string> = {
    LEI: 'Lei',
    LEI_COMPLEMENTAR: 'Lei Complementar',
    DECRETO: 'Decreto',
    DECRETO_LEI: 'Decreto-Lei',
    PORTARIA: 'Portaria',
    RESOLUCAO: 'Resolução',
    EMENDA: 'Emenda',
  };
  return map[tipo] ?? tipo;
}

function formatNumero(item: LegislacaoItem): string {
  return `${formatTipo(item.tipo)} nº ${item.numero}/${item.ano}`;
}

function formatDateBR(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function StatusBadge({ status }: { status: StatusLegislacao }) {
  const configs: Record<
    StatusLegislacao,
    { classes: string; icon: string; label: string }
  > = {
    ATIVA: {
      classes: 'bg-secondary-container/30 text-on-secondary-container',
      icon: 'check_circle',
      label: 'Ativa',
    },
    REVOGADA: {
      classes: 'bg-error-container/30 text-error',
      icon: 'cancel',
      label: 'Revogada',
    },
    ALTERADA: {
      classes: 'bg-tertiary-container/30 text-on-tertiary-container',
      icon: 'edit',
      label: 'Alterada',
    },
  };
  const cfg = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border-l-4 border-primary-container animate-pulse">
      <div className="h-4 w-24 bg-surface-container-high rounded mb-3" />
      <div className="h-5 w-3/4 bg-surface-container-high rounded mb-2" />
      <div className="h-4 w-full bg-surface-container-high rounded mb-1" />
      <div className="h-4 w-2/3 bg-surface-container-high rounded mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-surface-container-high rounded" />
        <div className="h-6 w-16 bg-surface-container-high rounded-full" />
      </div>
    </div>
  );
}

export default function LegislacoesClient() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoLegislacao | ''>('');
  const [ano, setAno] = useState<number | ''>('');
  const [status, setStatus] = useState<StatusLegislacao | ''>('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      size: 12,
      tipo,
      ano,
      status,
      busca: busca || undefined,
    }),
    [page, tipo, ano, status, busca]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.legislacao.list(params),
    queryFn: () => legislacaoService.list(params),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const size = data?.size ?? 12;
  const totalPages = Math.max(1, Math.ceil(total / size));

  const handleBusca = (value: string) => {
    setBusca(value);
    setPage(1);
  };

  const handleTipo = (value: TipoLegislacao | '') => {
    setTipo(value);
    setPage(1);
  };

  const handleAno = (value: number | '') => {
    setAno(value);
    setPage(1);
  };

  const handleStatus = (value: StatusLegislacao | '') => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-primary md:text-4xl">
          Legislações Municipais
        </h1>
        <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
          Consulte leis, decretos, portarias e demais atos normativos do município de Bandeirantes MS.
        </p>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            placeholder="Buscar por ementa, número ou autor..."
            className="w-full rounded-lg bg-surface-container-low py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => handleTipo(e.target.value as TipoLegislacao | '')}
              className="select-field"
            >
              {tipoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Ano</label>
            <select
              value={ano}
              onChange={(e) => handleAno(e.target.value ? Number(e.target.value) : '')}
              className="select-field"
            >
              <option value="">Todos os anos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value as StatusLegislacao | '')}
              className="select-field"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Erro */}
      {error instanceof Error && !isLoading && (
        <p className="text-sm text-red-300">{error.message}</p>
      )}

      {/* Grid de cards */}
      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3">search_off</span>
              <p className="text-base font-medium">Nenhuma legislação encontrada</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou termos de busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/legislacoes/${item.id}`}
                  className="group bg-surface-container-lowest rounded-xl p-6 shadow-ambient hover:shadow-ambient-lg transition-shadow border-l-4 border-primary-container"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="chip chip-primary">{formatTipo(item.tipo)}</span>
                    <StatusBadge status={item.status} />
                  </div>

                  <h3 className="mt-4 font-headline text-lg font-bold text-primary line-clamp-2">
                    {formatNumero(item)}
                  </h3>

                  <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{item.ementa}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {formatDateBR(item.data_publicacao)}
                    </span>
                    {item.autor ? <span>Autor: {item.autor}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Anterior
              </button>

              <span className="text-sm text-on-surface-variant">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
