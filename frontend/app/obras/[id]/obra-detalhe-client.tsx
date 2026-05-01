'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { formatCurrency, formatDate, obraStatusLabels, obraStatusTone } from '@/lib/obra-formatters';
import { obrasService } from '@/services/obra-service';
import ObraProgressChart from '@/components/obras/ObraProgressChart';
import ObraFinancialChart from '@/components/obras/ObraFinancialChart';
import ObraStatusPanel from '@/components/obras/ObraStatusPanel';
import ObraMeasurementHistory from '@/components/obras/ObraMeasurementHistory';
import ObraLocationMap from '@/components/obras/ObraLocationMap';
import ObraPhotoGallery from '@/components/obras/ObraPhotoGallery';

const metricFields = [
  ['Contrato', 'contrato'],
  ['Órgão', 'orgao'],
  ['Secretaria', 'secretaria'],
  ['Tipo da obra', 'tipo_obra'],
  ['Modalidade', 'modalidade'],
] as const;

interface ObraDetalheClientProps {
  id: string;
}

export default function ObraDetalheClient({ id }: ObraDetalheClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'obras', id],
    queryFn: () => obrasService.getByHash(id),
  });

  if (isLoading) {
    return <p className="text-sm text-on-surface-variant">Carregando detalhes da obra...</p>;
  }

  if (error instanceof Error || !data) {
    return <p className="text-sm text-red-300">{error instanceof Error ? error.message : 'Obra não encontrada.'}</p>;
  }

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/obras" className="flex items-center gap-1 hover:text-primary">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Obras
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="truncate text-primary">{data.titulo}</span>
      </nav>

      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-ambient-lg">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${obraStatusTone[data.status]}`}>
          {obraStatusLabels[data.status]}
        </span>
        <h1 className="mt-4 font-headline text-4xl font-extrabold">{data.titulo}</h1>
        <p className="mt-4 max-w-3xl text-sm text-primary-fixed-dim">{data.descricao}</p>
      </section>

      {/* Dashboard Grid: Charts + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ObraProgressChart
            progressoFisico={data.progresso_fisico}
            progressoFinanceiro={data.progresso_financeiro}
            medicoes={data.medicoes}
            dataInicio={data.data_inicio}
            previsaoTermino={data.previsao_termino}
          />
          <ObraFinancialChart medicoes={data.medicoes} />
        </div>

        <div className="space-y-6">
          <ObraStatusPanel
            progressoFisico={data.progresso_fisico}
            progressoFinanceiro={data.progresso_financeiro}
            valorOriginal={data.valor_original}
            valorHomologado={data.valor_homologado}
            valorMedidoTotal={data.valor_medido_total}
            medicoes={data.medicoes}
          />
          <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient">
            <h2 className="font-headline text-xl font-bold text-primary">Cronograma</h2>
            <div className="mt-5 space-y-4 text-sm text-on-surface">
              <p>Início: {formatDate(data.data_inicio)}</p>
              <p>Previsão de término: {formatDate(data.previsao_termino)}</p>
              <p>Término real: {formatDate(data.data_termino)}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Info Cards */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT: Progresso + Métricas */}
        <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient space-y-6">
          <h2 className="font-headline text-xl font-bold text-primary">Informações da Obra</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-container-lowest p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Progresso físico</p>
              <p className="mt-3 font-headline text-4xl font-black text-primary">{data.progresso_fisico ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Progresso financeiro</p>
              <p className="mt-3 font-headline text-4xl font-black text-primary">{data.progresso_financeiro ?? 0}%</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metricFields.map(([label, key]) => (
              <div key={key} className="rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                <p className="mt-3 text-sm font-semibold text-primary">{data[key] || '—'}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Financeiro + Locais + Fontes */}
        <div className="space-y-6">
          <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient">
            <h2 className="font-headline text-xl font-bold text-primary">Valores</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Valor original</p>
                <p className="mt-3 text-sm font-semibold text-primary">{formatCurrency(data.valor_original)}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Valor homologado</p>
                <p className="mt-3 text-sm font-semibold text-primary">{formatCurrency(data.valor_homologado)}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Valor economizado</p>
                <p className="mt-3 text-sm font-semibold text-primary">{formatCurrency(data.valor_economizado)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Locais da obra</p>
                <div className="mt-4 space-y-3">
                  {data.locations.map((location) => (
                    <div key={location.id ?? location.sequencia} className="rounded-2xl border border-outline/10 bg-surface p-4">
                      <p className="text-sm font-semibold text-primary">
                        {location.logradouro}, {location.numero} - {location.bairro}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">CEP {location.cep || '—'}</p>
                      {location.latitude !== null && location.longitude !== null ? (
                        <p className="mt-2 text-xs text-on-surface-variant">Pin: {location.latitude}, {location.longitude}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Fontes de recurso</p>
                <div className="mt-4 space-y-3">
                  {data.funding_sources.map((source) => (
                    <div key={source.id ?? source.sequencia} className="flex items-center justify-between gap-4 rounded-2xl border border-outline/10 bg-surface p-4">
                      <p className="text-sm font-semibold text-primary">{source.nome}</p>
                      <span className="text-sm text-secondary">{formatCurrency(source.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Measurement History */}
      <ObraMeasurementHistory medicoes={data.medicoes} />

      {/* Map + Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ObraLocationMap locations={data.locations} />
        <ObraPhotoGallery mediaAssets={data.media_assets} />
      </div>
    </div>
  );
}