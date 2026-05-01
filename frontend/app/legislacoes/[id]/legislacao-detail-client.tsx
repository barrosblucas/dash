'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/lib/constants';
import { legislacaoService } from '@/services/legislacao-service';
import type { StatusLegislacao, TipoLegislacao } from '@/types/legislacao';

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

function formatNumero(tipo: TipoLegislacao, numero: string, ano: number): string {
  return `${formatTipo(tipo)} nº ${numero}/${ano}`;
}

function formatDateBR(iso: string | null): string {
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
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${cfg.classes}`}>
      <span className="material-symbols-outlined text-[16px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

interface InfoFieldProps {
  label: string;
  value: string | null;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-primary">{value || '—'}</p>
    </div>
  );
}

interface LegislacaoDetailClientProps {
  id: string;
}

export default function LegislacaoDetailClient({ id }: LegislacaoDetailClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.legislacao.detail(id),
    queryFn: () => legislacaoService.getById(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-4 w-32 bg-surface-container-high rounded" />
        <div className="h-8 w-2/3 bg-surface-container-high rounded" />
        <div className="h-4 w-full bg-surface-container-high rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-container-high rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-surface-container-high rounded-2xl" />
      </div>
    );
  }

  if (error instanceof Error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/legislacoes"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar para Legislações
        </Link>
        <p className="text-sm text-red-300">
          {error instanceof Error ? error.message : 'Legislação não encontrada.'}
        </p>
      </div>
    );
  }

  const titulo = formatNumero(data.tipo, data.numero, data.ano);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary">
          Portal
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href="/legislacoes" className="hover:text-primary">
          Legislações
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="truncate text-primary">{titulo}</span>
      </nav>

      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-ambient-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip chip-primary">{formatTipo(data.tipo)}</span>
          <StatusBadge status={data.status} />
        </div>
        <h1 className="mt-4 font-headline text-3xl font-extrabold md:text-4xl">{titulo}</h1>
        <p className="mt-4 max-w-3xl text-sm text-primary-fixed-dim">{data.ementa}</p>
      </section>

      {/* Informações em grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoField label="Data da Publicação" value={formatDateBR(data.data_publicacao)} />
        <InfoField label="Data da Promulgação" value={formatDateBR(data.data_promulgacao)} />
        <InfoField label="Início da Vigência" value={formatDateBR(data.data_vigencia_inicio)} />
        <InfoField label="Fim da Vigência" value={formatDateBR(data.data_vigencia_fim)} />
        <InfoField label="Autor" value={data.autor} />
        <InfoField label="Sancionado por" value={data.sancionado_por} />
        <InfoField label="Origem" value={data.origem} />
        <InfoField label="Ano" value={String(data.ano)} />
      </section>

      {/* Texto integral */}
      <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient">
        <h2 className="font-headline text-xl font-bold text-primary">Texto Integral</h2>
        <div className="mt-5 max-h-[600px] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
          {data.texto_integral}
        </div>
      </section>

      {/* Legislações vinculadas */}
      {data.legislacao_vinculada && data.legislacao_vinculada.length > 0 && (
        <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient">
          <h2 className="font-headline text-xl font-bold text-primary">Legislações Vinculadas</h2>
          <div className="mt-5 space-y-3">
            {data.legislacao_vinculada.map((vinculo, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest p-4"
              >
                <span className="material-symbols-outlined text-on-surface-variant">link</span>
                <span className="text-sm font-medium text-primary">{vinculo}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Download + Voltar */}
      <div className="flex flex-wrap items-center gap-4">
        {data.url_arquivo && (
          <a
            href={data.url_arquivo}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Baixar PDF
          </a>
        )}
        <Link href="/legislacoes" className="btn-outline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Voltar para Legislações
        </Link>
      </div>
    </div>
  );
}
