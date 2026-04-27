import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ObrasListPage from '@/components/admin/obras/ObrasListPage';
import { renderWithQuery } from '@/test/helpers';
import { obrasService } from '@/services/obra-service';

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/services/obra-service');

const baseObra = {
  descricao: '',
  orgao: '',
  contrato: '',
  tipo_obra: '',
  modalidade: '',
  fonte_recurso: '',
  data_inicio: null,
  previsao_termino: null,
  data_termino: null,
  logradouro: '',
  bairro: '',
  cep: '',
  numero: '',
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
  locations: [],
  funding_sources: [],
  media_assets: [],
  medicoes: [],
  created_at: '',
  updated_at: '',
};

describe('ObrasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista obras retornadas pelo serviço', async () => {
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [
        { ...baseObra, hash: 'abc123', titulo: 'Pavimentação Rua A', status: 'em_andamento', secretaria: 'Infraestrutura', valor_medido_total: 150000 },
        { ...baseObra, hash: 'def456', titulo: 'Reforma Escola B', status: 'concluida', secretaria: 'Educação', valor_medido_total: 320000 },
      ],
      total: 2,
    });
    renderWithQuery(<ObrasListPage />);
    await waitFor(() => expect(screen.getByText('Pavimentação Rua A')).toBeInTheDocument());
    expect(screen.getByText('Infraestrutura')).toBeInTheDocument();
    expect(screen.getByText('Reforma Escola B')).toBeInTheDocument();
    expect(screen.getByText('Educação')).toBeInTheDocument();
    expect(screen.getAllByText('Editar')).toHaveLength(2);
    expect(screen.getAllByText('Excluir')).toHaveLength(2);
  });

  it('exclui obra ao clicar em Excluir', async () => {
    const user = userEvent.setup();
    vi.mocked(obrasService.list).mockResolvedValue({
      obras: [
        { ...baseObra, hash: 'abc123', titulo: 'Pavimentação Rua A', status: 'em_andamento', secretaria: 'Infra', valor_medido_total: 0 },
      ],
      total: 1,
    });
    vi.mocked(obrasService.remove).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof obrasService.remove>>);
    renderWithQuery(<ObrasListPage />);
    await waitFor(() => expect(screen.getByText('Pavimentação Rua A')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /excluir/i }));
    await waitFor(() => expect(obrasService.remove).toHaveBeenCalledWith('abc123'));
  });

  it('exibe mensagem de erro quando a listagem falha', async () => {
    vi.mocked(obrasService.list).mockRejectedValue(new Error('Falha ao carregar obras'));
    renderWithQuery(<ObrasListPage />);
    await waitFor(() => expect(screen.getByText(/falha ao carregar obras/i)).toBeInTheDocument());
  });
});
