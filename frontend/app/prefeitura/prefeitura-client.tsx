'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import {
  PrefeituraCard,
  PrefeituraContactBlock,
  PrefeituraFeatureNav,
  PrefeituraPageHeader,
  PrefeituraPlaceholder,
} from '@/components/prefeitura';
import { institucionalService } from '@/services/institucional-service';

export default function PrefeituraClient() {
  const { data: cityHall, isLoading, error } = useQuery({
    queryKey: ['public', 'institucional', 'prefeitura'],
    queryFn: () => institucionalService.getCityHall(),
  });

  const hasContact = cityHall?.contact && (
    cityHall.contact.address ||
    cityHall.contact.phone ||
    cityHall.contact.email ||
    cityHall.contact.office_hours
  );

  return (
    <div className="space-y-8">
      <PrefeituraPageHeader
        eyebrow="Prefeitura Municipal"
        title={cityHall?.city_hall_name ?? 'Prefeitura Municipal de Bandeirantes'}
        description="Conheça a estrutura administrativa, a gestão atual, as secretarias e os canais de atendimento da prefeitura."
      />

      <PrefeituraFeatureNav />

      {isLoading && (
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-[28px] bg-surface-container-high" />
          <div className="h-32 animate-pulse rounded-[28px] bg-surface-container-high" />
        </div>
      )}

      {error instanceof Error && (
        <PrefeituraPlaceholder title="Erro ao carregar dados" description={error.message} />
      )}

      {!isLoading && !error && cityHall && (
        <>
          {/* Hero / Imagem */}
          <div className="relative overflow-hidden rounded-[28px] border border-outline/10 bg-surface-container-low shadow-ambient">
            {cityHall.image_url ? (
              <img
                src={cityHall.image_url}
                alt={cityHall.city_hall_name}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 sm:h-80">
                <span className="material-symbols-outlined text-7xl text-primary/30">account_balance</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-8">
              <h2 className="font-headline text-2xl font-bold text-white">{cityHall.city_hall_name}</h2>
            </div>
          </div>

          {/* Descrição */}
          {cityHall.description ? (
            <PrefeituraCard title="Sobre">
              <p className="text-base leading-7 text-on-surface">{cityHall.description}</p>
            </PrefeituraCard>
          ) : null}

          {/* Contatos */}
          {hasContact ? (
            <PrefeituraCard title="Contato e Atendimento">
              <PrefeituraContactBlock contact={cityHall.contact} />
            </PrefeituraCard>
          ) : null}

          {/* Redes sociais */}
          {cityHall.social_links && cityHall.social_links.length > 0 ? (
            <PrefeituraCard title="Redes Sociais">
              <div className="flex flex-wrap gap-3">
                {cityHall.social_links.map((link) => (
                  <a
                    key={link.label + link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-surface-container p-3 text-sm font-medium text-primary transition hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined">link</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </PrefeituraCard>
          ) : null}

          {/* Navegação rápida para subpáginas */}
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/prefeitura/prefeito-e-vice"
              className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h3 className="mt-5 font-headline text-xl font-bold text-primary">Prefeito e Vice</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Conheça os gestores eleitos e suas trajetórias.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Saiba mais
                <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/prefeitura/gabinete"
              className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">workspaces</span>
              </div>
              <h3 className="mt-5 font-headline text-xl font-bold text-primary">Gabinete do Prefeito</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Estrutura do gabinete e equipe de assessoria direta.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Saiba mais
                <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/prefeitura/secretarias"
              className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">corporate_fare</span>
              </div>
              <h3 className="mt-5 font-headline text-xl font-bold text-primary">Secretarias</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Organograma das secretarias e autarquias municipais.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Saiba mais
                <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/prefeitura/reparticoes"
              className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <h3 className="mt-5 font-headline text-xl font-bold text-primary">Repartições</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Endereços, telefones e localização dos setores municipais.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Saiba mais
                <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>
          </section>
        </>
      )}

      {!isLoading && !error && !cityHall && (
        <PrefeituraPlaceholder />
      )}
    </div>
  );
}
