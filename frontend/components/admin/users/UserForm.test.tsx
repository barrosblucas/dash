import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import UserForm from '@/components/admin/users/UserForm';
import { renderWithQuery } from '@/test/helpers';
import { usersService } from '@/services/user-service';

vi.mock('next/navigation');
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/services/user-service');

describe('UserForm - criação', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  it('renderiza formulário de criação com campo senha', () => {
    renderWithQuery(<UserForm />);
    expect(screen.getByText('Novo usuário')).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/usuário ativo/i)).not.toBeInTheDocument();
  });

  it('cria usuário ao submeter formulário preenchido', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.create).mockResolvedValue({ id: 3 } as unknown as Awaited<ReturnType<typeof usersService.create>>);
    renderWithQuery(<UserForm />);
    await user.type(screen.getByLabelText(/nome/i), 'Carlos Lima');
    await user.type(screen.getByLabelText(/e-mail/i), 'carlos@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'Secure123!');
    await user.click(screen.getByRole('button', { name: /criar usuário/i }));
    await waitFor(() => expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carlos Lima', email: 'carlos@test.com', password: 'Secure123!', role: 'user', is_active: true })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/users'));
  });
});

describe('UserForm - edição', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  it('carrega dados do usuário e permite atualização', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.getById).mockResolvedValue({
      id: 1, name: 'Ana Silva', email: 'ana@test.com', role: 'admin', is_active: true,
      token_version: 1, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z', last_login_at: null,
    });
    vi.mocked(usersService.update).mockResolvedValue({ id: 1 } as unknown as Awaited<ReturnType<typeof usersService.update>>);
    renderWithQuery(<UserForm userId="1" />);
    await waitFor(() => expect(screen.getByDisplayValue('Ana Silva')).toBeInTheDocument());
    expect(screen.getByDisplayValue('ana@test.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/usuário ativo/i)).toBeChecked();
    await user.clear(screen.getByLabelText(/nome/i));
    await user.type(screen.getByLabelText(/nome/i), 'Ana S. Editada');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() => expect(usersService.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Ana S. Editada', email: 'ana@test.com', role: 'admin', is_active: true })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/users'));
  });

  it('exibe link de reset de senha ao clicar no botão correspondente', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.getById).mockResolvedValue({
      id: 1, name: 'Ana Silva', email: 'ana@test.com', role: 'admin', is_active: true,
      token_version: 1, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z', last_login_at: null,
    });
    vi.mocked(usersService.resetPassword).mockResolvedValue({
      reset_token: 'abc123',
      reset_url: 'http://localhost/reset?token=abc123',
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    });
    renderWithQuery(<UserForm userId="1" />);
    await waitFor(() => expect(screen.getByText(/reset de senha/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /gerar link de reset/i }));
    await waitFor(() => expect(usersService.resetPassword).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument());
    expect(screen.getByText(/link de reset gerado com sucesso/i)).toBeInTheDocument();
  });
});
