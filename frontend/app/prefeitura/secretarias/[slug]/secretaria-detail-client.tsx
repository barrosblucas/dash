'use client';

import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraCard,
  PrefeituraContactBlock,
  PrefeituraFeatureNav,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

interface SecretariaDetailClientProps {
  slug: string;
}

export default function SecretariaDetailClient({ slug }: SecretariaDetailClientProps) {
  const { data: dept, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'secretaria', slug],
    queryFn: () => institucionalService.getDepartmentBySlug(slug),
  });

  const hasContact = dept && (
    dept.address || dept.phone || dept.email || dept.office_hours
  );

  const contact = hasContact
    ? {
        address: dept.address,
        phone: dept.phone,
        email: dept.email,
        office_hours: dept.office_hours,
      }
    : null;

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow={dept?.kind === 'autarquia' ? 'Autarquia' : 'Secretaria'}
        title={dept?.name ?? 'Detalhe da Secretaria'}
        description={dept?.description ?? 'Informações institucionais, missão, visão e contatos.'}
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-[28px] bg-surface-container-high" />
          <div className="h-40 animate-pulse rounded-[28px] bg-surface-container-high" />
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && dept && (
        <>
          {/* Hero com imagem e secretário */}
          <div className="relative overflow-hidden rounded-[28px] border border-outline/10 bg-surface-container-low shadow-ambient">
            <div className="flex flex-col md:flex-row">
              {dept.image_url ? (
                <div className="md:w-1/2">
                  <img src={dept.image_url} alt={dept.name} className="h-56 w-full object-cover md:h-full" />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 md:h-auto md:w-1/2">
                  <span className="material-symbols-outlined text-7xl text-primary/30">corporate_fare</span>
                </div>
              )}
              <div className="flex flex-col justify-center p-6 md:w-1/2 md:p-8">
                <h2 className="font-headline text-2xl font-bold text-primary">{dept.name}</h2>
                {dept.secretary_name ? (
                  <div className="mt-4 flex items-center gap-4">
                    {dept.secretary_photo_url ? (
                      <img
                        src={dept.secretary_photo_url}
                        alt={dept.secretary_name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/10"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/10">
                        <span className="material-symbols-outlined text-2xl text-primary/40">person</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-on-surface-variant">{dept.leader_title ?? 'Secretário'}</p>
                      <p className="font-headline text-lg font-bold text-primary">{dept.secretary_name}</p>
                    </div>
                  </div>
                ) : (
                  <PrefeituraPlaceholder title="Informações em atualização" description="Dados do gestor serão publicados em breve." />
                )}
              </div>
            </div>
          </div>

          {/* Missão, Visão, Valores */}
          {(dept.mission || dept.vision || dept.values) && (
            <div className="grid gap-6 md:grid-cols-3">
              {dept.mission && (
                <PrefeituraCard title="Missão">
                  <p className="text-sm leading-6 text-on-surface">{dept.mission}</p>
                </PrefeituraCard>
              )}
              {dept.vision && (
                <PrefeituraCard title="Visão">
                  <p className="text-sm leading-6 text-on-surface">{dept.vision}</p>
                </PrefeituraCard>
              )}
              {dept.values && (
                <PrefeituraCard title="Valores">
                  <p className="text-sm leading-6 text-on-surface">{dept.values}</p>
                </PrefeituraCard>
              )}
            </div>
          )}

          {/* Contato */}
          {contact && (
            <PrefeituraCard title="Contato">
              <PrefeituraContactBlock contact={contact} />
            </PrefeituraCard>
          )}
        </>
      )}

      {!isLoading && !error && !dept && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
