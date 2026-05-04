import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ObrasClient from '@/app/obras/obras-client';
import { renderWithQuery } from '@/test/helpers';
import { obrasService } from '@/services/obra-service';
import type { ObraRecord } from '@/types/obra';

vi.mock('@/services/obra-service');
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));

const createObra = (overrides: Partial<ObraRecord> = {}): ObraRecord => ({
  hash: 'test-hash',
  titulo: 'Praça Central',
  descricao: 'Revitalização da praça central',
  status: 'em_andamento',
  secretaria: 'Obras',
  orgao: 'Prefeitura',
  contrato: 'CTR-01',
  tipo_obra: 'Revitalização',
  modalidade: 'Concorrência',
  fonte_recurso: 'Tesouro Municipal',
  data_inicio: '2026-01-10',
  previsao_termino: null,
  data_termino: null,
  logradouro: 'Rua A',
  bairro: 'Centro',
  cep: '79000-000',
  numero: '100',
  latitude: null,
  longitude: null,
  valor_orcamento: null,
  valor_original: null,
  valor_aditivo: null,
  valor_homologado: null,
  valor_contrapartida: null,
  valor_convenio: null,
  valor_economizado: null,
  progresso_fisico: null,
  progresso_financeiro: null,
  locations: [{ id: 1, sequencia: 1, logradouro: 'Rua A', bairro: 'Centro', cep: '79000-000', numero: '100', latitude: null, longitude: null }],
  funding_sources: [{ id: 1, sequencia: 1, nome: 'Tesouro Municipal', valor: null }],
  media_assets: [],
  medicoes: [],
  valor_medido_total: 0,
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
  ...overrides,
});

describe('ObrasClient - imagem de capa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza placeholder quando obra não tem mídias', async () => {
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [createObra()],
      total: 1,
    });
    renderWithQuery(<ObrasClient />);
    await waitFor(() => {
      expect(screen.getByText('Praça Central')).toBeInTheDocument();
    });
    const icon = document.querySelector('.material-symbols-outlined.text-6xl');
    expect(icon).toBeInTheDocument();
  });

  it('renderiza imagem de capa quando obra tem media_asset com is_cover=true', async () => {
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [
        createObra({
          media_assets: [
            { id: 1, titulo: 'Foto 1', media_kind: 'image', source_type: 'upload', url: '/uploads/foto1.jpg', is_cover: false },
            { id: 2, titulo: 'Foto Capa', media_kind: 'image', source_type: 'upload', url: '/uploads/capa.jpg', is_cover: true },
          ],
        }),
      ],
      total: 1,
    });
    renderWithQuery(<ObrasClient />);
    await waitFor(() => {
      expect(screen.getByText('Praça Central')).toBeInTheDocument();
    });
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/uploads/capa.jpg');
    expect(img).toHaveAttribute('alt', 'Foto Capa');
  });

  it('faz fallback para primeira imagem quando não existe is_cover=true', async () => {
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [
        createObra({
          media_assets: [
            { id: 1, titulo: 'Primeira', media_kind: 'image', source_type: 'upload', url: '/uploads/primeira.jpg', is_cover: false },
            { id: 2, titulo: 'Segunda', media_kind: 'image', source_type: 'upload', url: '/uploads/segunda.jpg', is_cover: false },
          ],
        }),
      ],
      total: 1,
    });
    renderWithQuery(<ObrasClient />);
    await waitFor(() => {
      expect(screen.getByText('Praça Central')).toBeInTheDocument();
    });
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/uploads/primeira.jpg');
  });

  it('faz fallback para placeholder quando obra só tem mídias não-imagem', async () => {
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [
        createObra({
          media_assets: [
            { id: 1, titulo: 'Documento', media_kind: 'document', source_type: 'upload', url: '/uploads/doc.pdf', is_cover: false },
          ],
        }),
      ],
      total: 1,
    });
    renderWithQuery(<ObrasClient />);
    await waitFor(() => {
      expect(screen.getByText('Praça Central')).toBeInTheDocument();
    });
    const icon = document.querySelector('.material-symbols-outlined.text-6xl');
    expect(icon).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });
});
