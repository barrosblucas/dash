'use client';

import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraCard,
  PrefeituraFeatureNav,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function ReparticoesClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'reparticoes'],
    queryFn: () => institucionalService.listOffices(),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow="Estrutura Administrativa"
        title="Repartições e Setores"
        description="Endereços, telefones e informações de localização dos setores e repartições municipais."
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[28px] bg-surface-container-high" />
          ))}
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((office) => (
            <PrefeituraCard key={office.id} title={office.name}>
              <div className="space-y-3">
                {office.department_name && (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">corporate_fare</span>
                    Vinculado a: {office.department_name}
                  </div>
                )}
                {office.description && (
                  <p className="text-sm leading-6 text-on-surface-variant">{office.description}</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {office.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-primary/60">location_on</span>
                      <span className="text-on-surface">{office.address}</span>
                    </div>
                  )}
                  {office.phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-primary/60">call</span>
                      <span className="text-on-surface">{office.phone}</span>
                    </div>
                  )}
                  {office.email && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-primary/60">mail</span>
                      <span className="text-on-surface">{office.email}</span>
                    </div>
                  )}
                  {office.office_hours && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-primary/60">schedule</span>
                      <span className="text-on-surface">{office.office_hours}</span>
                    </div>
                  )}
                </div>
                {office.latitude && office.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${office.latitude},${office.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">map</span>
                    Ver no mapa
                  </a>
                )}
              </div>
            </PrefeituraCard>
          ))}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <PrefeituraPlaceholder />
      )}

      {!isLoading && !error && !data && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
