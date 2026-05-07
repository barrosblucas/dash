'use client';

import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraCard,
  PrefeituraFeatureNav,
  PrefeituraOfficialCard,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function GabineteClient() {
  const { data: management, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'gestao'],
    queryFn: () => institucionalService.getManagement(),
  });

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow="Estrutura Administrativa"
        title="Gabinete do Prefeito"
        description="Conheça a equipe de assessoria direta e a função do gabinete na coordenação das ações de governo."
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-[28px] bg-surface-container-high" />
          <div className="h-80 animate-pulse rounded-[28px] bg-surface-container-high" />
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && management && (
        <>
          {management.cabinet_description ? (
            <PrefeituraCard title="Sobre o Gabinete">
              <p className="text-base leading-7 text-on-surface">{management.cabinet_description}</p>
            </PrefeituraCard>
          ) : null}

          <PrefeituraCard title="Chefe de Gabinete">
            <div className="max-w-md">
              <PrefeituraOfficialCard official={management.cabinet_chief} />
            </div>
          </PrefeituraCard>
        </>
      )}

      {!isLoading && !error && !management && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
