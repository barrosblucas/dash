'use client';

import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraFeatureNav,
  PrefeituraOfficialCard,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function PrefeitoViceClient() {
  const { data: management, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'gestao'],
    queryFn: () => institucionalService.getManagement(),
  });

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow="Gestão Municipal"
        title="Prefeito e Vice-Prefeito"
        description="Conheça os gestores eleitos que conduzem a administração pública do município."
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[28px] bg-surface-container-high" />
          <div className="h-80 animate-pulse rounded-[28px] bg-surface-container-high" />
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && management && (
        <div className="grid gap-6 md:grid-cols-2">
          <PrefeituraOfficialCard official={management.mayor} />
          <PrefeituraOfficialCard official={management.vice_mayor} />
        </div>
      )}

      {!isLoading && !error && !management && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
