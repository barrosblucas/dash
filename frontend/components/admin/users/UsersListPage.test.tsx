import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import UsersListPage from '@/components/admin/users/UsersListPage';
import { renderWithQuery } from '@/test/helpers';
import { usersService } from '@/services/user-service';

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/services/user-service');

describe('UsersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista usuários retornados pelo serviço', async () => {
    vi.mocked(usersService.list).mockResolvedValue({
      users: [
        { id: 1, name: 'Ana Silva', email: 'ana@test.com', role: 'admin', is_active: true, token_version: 1, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z', last_login_at: null },
        { id: 2, name: 'Bruno Souza', email: 'bruno@test.com', role: 'user', is_active: false, token_version: 1, created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', last_login_at: null },
      ],
      total: 2,
    });
    renderWithQuery(<UsersListPage />);
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument());
    expect(screen.getByText('ana@test.com')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Bruno Souza')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(screen.getAllByText('Editar')).toHaveLength(2);
  });

  it('exibe estado de carregamento inicialmente', () => {
    vi.mocked(usersService.list).mockImplementation(() => new Promise(() => {}));
    renderWithQuery(<UsersListPage />);
    expect(screen.getByText(/carregando usuários/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando a listagem falha', async () => {
    vi.mocked(usersService.list).mockRejectedValue(new Error('Falha ao carregar usuários'));
    renderWithQuery(<UsersListPage />);
    await waitFor(() => expect(screen.getByText(/falha ao carregar usuários/i)).toBeInTheDocument());
  });

  it('renderiza botão para criar novo usuário', async () => {
    vi.mocked(usersService.list).mockResolvedValue({ users: [], total: 0 });
    renderWithQuery(<UsersListPage />);
    await waitFor(() => expect(screen.getByText('Novo usuário')).toBeInTheDocument());
  });
});
