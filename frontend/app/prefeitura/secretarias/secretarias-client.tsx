'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraFeatureNav,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function SecretariasClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'secretarias'],
    queryFn: () => institucionalService.listDepartments(),
  });

  const secretarias = data?.items.filter((d) => d.kind === 'secretaria') ?? [];
  const autarquias = data?.items.filter((d) => d.kind === 'autarquia') ?? [];

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow="Organograma"
        title="Secretarias e Autarquias"
        description="Conheça as secretarias municipais e as autarquias que prestam serviços à população."
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[28px] bg-surface-container-high" />
          ))}
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && data && (
        <>
          {secretarias.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-headline text-xl font-bold text-primary">Secretarias</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {secretarias.map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/prefeitura/secretarias/${dept.slug}`}
                    className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">corporate_fare</span>
                      </div>
                      <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
                        Secretaria
                      </span>
                    </div>
                    <h3 className="mt-5 font-headline text-lg font-bold text-primary">{dept.name}</h3>
                    {dept.secretary_name ? (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {dept.leader_title ?? 'Secretário'}: {dept.secretary_name}
                      </p>
                    ) : null}
                    {dept.description ? (
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant line-clamp-2">
                        {dept.description}
                      </p>
                    ) : null}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Ver detalhes
                      <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {autarquias.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-headline text-xl font-bold text-primary">Autarquias</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {autarquias.map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/prefeitura/secretarias/${dept.slug}`}
                    className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">water_drop</span>
                      </div>
                      <span className="rounded-full bg-tertiary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary">
                        Autarquia
                      </span>
                    </div>
                    <h3 className="mt-5 font-headline text-lg font-bold text-primary">{dept.name}</h3>
                    {dept.secretary_name ? (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {dept.leader_title ?? 'Diretor'}: {dept.secretary_name}
                      </p>
                    ) : null}
                    {dept.description ? (
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant line-clamp-2">
                        {dept.description}
                      </p>
                    ) : null}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Ver detalhes
                      <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {secretarias.length === 0 && autarquias.length === 0 && (
            <PrefeituraPlaceholder />
          )}
        </>
      )}

      {!isLoading && !error && !data && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
