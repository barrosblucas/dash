import { screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import PrefeituraClient from '@/app/prefeitura/prefeitura-client';
import { renderWithQuery } from '@/test/helpers';
import { institucionalService } from '@/services/institucional-service';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/prefeitura',
}));

vi.mock('@/services/institucional-service', () => ({
  institucionalService: {
    getCityHall: vi.fn(),
  },
}));

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always' },
      mutations: { retry: false, networkMode: 'always' },
    },
  });
}

describe('PrefeituraClient', () => {
  beforeEach(() => {
    vi.mocked(institucionalService.getCityHall).mockReset();
  });

  it('renderiza estado de carregamento inicialmente', () => {
    vi.mocked(institucionalService.getCityHall).mockResolvedValue({
      city_hall_name: 'Prefeitura Teste',
      description: null,
      image_url: null,
      contact: { address: null, phone: null, email: null, office_hours: null },
      social_links: [],
      updated_at: '',
    });

    renderWithQuery(<PrefeituraClient />, createTestClient());

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renderiza dados da prefeitura com contatos e redes sociais', async () => {
    vi.mocked(institucionalService.getCityHall).mockResolvedValue({
      city_hall_name: 'Prefeitura Municipal de Bandeirantes',
      description: 'Descrição da prefeitura',
      image_url: null,
      contact: {
        address: 'Rua Principal, 100',
        phone: '6733330000',
        email: 'contato@bandeirantes.ms.gov.br',
        office_hours: '08:00 às 17:00',
      },
      social_links: [
        { label: 'Facebook', url: 'https://facebook.com/teste' },
      ],
      updated_at: '2026-05-06T10:00:00',
    });

    renderWithQuery(<PrefeituraClient />, createTestClient());

    expect(await screen.findByText('Prefeitura Municipal de Bandeirantes')).toBeInTheDocument();
    expect(await screen.findByText('Descrição da prefeitura')).toBeInTheDocument();
    expect(screen.getByText('Rua Principal, 100')).toBeInTheDocument();
    expect(screen.getByText('6733330000')).toBeInTheDocument();
    expect(screen.getByText('contato@bandeirantes.ms.gov.br')).toBeInTheDocument();
    expect(screen.getByText('08:00 às 17:00')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });

  it('exibe links de navegação para subpáginas', async () => {
    vi.mocked(institucionalService.getCityHall).mockResolvedValue({
      city_hall_name: 'Prefeitura Teste',
      description: null,
      image_url: null,
      contact: { address: null, phone: null, email: null, office_hours: null },
      social_links: [],
      updated_at: '',
    });

    renderWithQuery(<PrefeituraClient />, createTestClient());

    expect(await screen.findByText('Prefeito e Vice')).toBeInTheDocument();
    expect(await screen.findByText('Gabinete do Prefeito')).toBeInTheDocument();
    expect(screen.getAllByText('Secretarias').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Repartições').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza fallback quando o nome do gestor ainda não foi informado', async () => {
    vi.mocked(institucionalService.getCityHall).mockResolvedValue({
      city_hall_name: 'Prefeitura Teste',
      description: null,
      image_url: null,
      contact: { address: null, phone: null, email: null, office_hours: null },
      social_links: [],
      updated_at: '',
    });

    renderWithQuery(<PrefeituraClient />, createTestClient());

    expect((await screen.findAllByText('Prefeitura Teste')).length).toBeGreaterThan(0);
  });
});
