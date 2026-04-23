import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ObraForm from '@/components/admin/obras/ObraForm';
import { renderWithQuery } from '@/test/helpers';
import { obrasService } from '@/services/obra-service';

vi.mock('next/navigation');
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/services/obra-service');

describe('ObraForm - criação', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  it('renderiza formulário de criação com campos principais', () => {
    renderWithQuery(<ObraForm />);
    expect(screen.getByText('Nova obra')).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/secretaria/i)).toBeInTheDocument();
  });

  it('cria obra ao submeter com campos preenchidos', async () => {
    const user = userEvent.setup();
    vi.mocked(obrasService.create).mockResolvedValue({ hash: 'new-hash' } as unknown as Awaited<ReturnType<typeof obrasService.create>>);
    renderWithQuery(<ObraForm />);
    await user.type(screen.getByLabelText(/título/i), 'Praça Central');
    await user.type(screen.getByLabelText(/secretaria/i), 'Obras');
    await user.type(screen.getByLabelText(/descrição/i), 'Revitalização da praça central');
    await user.click(screen.getByRole('button', { name: /criar obra/i }));
    await waitFor(() => expect(obrasService.create).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Praça Central', secretaria: 'Obras', descricao: 'Revitalização da praça central' })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/obras'));
  });
});

describe('ObraForm - edição com medições', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  it('carrega obra e permite edição de medições', async () => {
    const user = userEvent.setup();
    vi.mocked(obrasService.getByHash).mockResolvedValue({
      hash: 'edit-hash',
      titulo: 'Escola Modelo',
      descricao: 'Reforma',
      status: 'em_andamento',
      secretaria: 'Educação',
      orgao: 'Secretaria',
      contrato: 'C-001',
      tipo_obra: 'Reforma',
      modalidade: 'Convite',
      fonte_recurso: 'Municipal',
      data_inicio: '2024-01-01',
      previsao_termino: null,
      data_termino: null,
      logradouro: 'Rua A',
      bairro: 'Centro',
      cep: '79000-000',
      numero: '100',
      latitude: null,
      longitude: null,
      valor_orcamento: 500000,
      valor_original: 450000,
      valor_aditivo: null,
      valor_homologado: null,
      valor_contrapartida: null,
      valor_convenio: null,
      valor_economizado: null,
      progresso_fisico: 50,
      progresso_financeiro: 45,
      medicoes: [
        { id: 1, sequencia: 1, mes_referencia: 3, ano_referencia: 2024, valor_medicao: 100000, observacao: 'Primeira medição' },
      ],
      valor_medido_total: 100000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    });
    vi.mocked(obrasService.update).mockResolvedValue({ hash: 'edit-hash' } as unknown as Awaited<ReturnType<typeof obrasService.update>>);
    renderWithQuery(<ObraForm obraHash="edit-hash" />);
    await waitFor(() => expect(screen.getByDisplayValue('Escola Modelo')).toBeInTheDocument());
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
    const medicaoValorInput = screen.getByDisplayValue('100000');
    await user.clear(medicaoValorInput);
    await user.type(medicaoValorInput, '150000');
    await user.click(screen.getByRole('button', { name: /salvar obra/i }));
    await waitFor(() => expect(obrasService.update).toHaveBeenCalledWith(
      'edit-hash',
      expect.objectContaining({
        medicoes: expect.arrayContaining([
          expect.objectContaining({ sequencia: 1, valor_medicao: 150000 }),
        ]),
      })
    ));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/obras'));
  });

  it('adiciona e remove medição', async () => {
    const user = userEvent.setup();
    vi.mocked(obrasService.getByHash).mockResolvedValue({
      hash: 'edit-hash',
      titulo: 'Escola Modelo',
      descricao: 'Reforma',
      status: 'em_andamento',
      secretaria: 'Educação',
      orgao: '',
      contrato: '',
      tipo_obra: '',
      modalidade: '',
      fonte_recurso: '',
      data_inicio: '',
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
      medicoes: [],
      valor_medido_total: 0,
      created_at: '',
      updated_at: '',
    });
    vi.mocked(obrasService.update).mockResolvedValue({ hash: 'edit-hash' } as unknown as Awaited<ReturnType<typeof obrasService.update>>);
    renderWithQuery(<ObraForm obraHash="edit-hash" />);
    await waitFor(() => expect(screen.getByDisplayValue('Escola Modelo')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /adicionar medição/i }));
    await waitFor(() => expect(screen.getAllByLabelText(/sequência/i)).toHaveLength(1));
    const valorInputs = screen.getAllByLabelText(/valor/i);
    const medicaoValorInput = valorInputs[valorInputs.length - 1];
    await user.type(medicaoValorInput, '50000');
    await user.click(screen.getByRole('button', { name: /remover/i }));
    await waitFor(() => expect(screen.queryByLabelText(/sequência/i)).not.toBeInTheDocument());
  });
});
