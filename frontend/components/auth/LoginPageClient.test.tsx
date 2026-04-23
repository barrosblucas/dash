import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import LoginPageClient from '@/components/auth/LoginPageClient';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/authStore';
import type { AuthSessionResponse } from '@/types/identity';
import type { UserRecord } from '@/types/user';

vi.mock('next/navigation');
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/stores/authStore');
vi.mock('@/services/auth-service');

function createUser(): UserRecord {
  return {
    id: 1,
    name: 'Admin',
    email: 'a@b.com',
    role: 'admin',
    is_active: true,
    token_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null,
  };
}

function createSession(): AuthSessionResponse['session'] {
  return {
    access_token: 'tok',
    access_token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
    refresh_token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
    token_type: 'bearer',
    user: createUser(),
  };
}

describe('LoginPageClient', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>);
  });

  function setAuthState(overrides: Partial<ReturnType<typeof useAuthStore>> = {}) {
    const state = {
      initialized: false,
      session: null as AuthSessionResponse['session'],
      status: 'loading' as const,
      setLoading: vi.fn(),
      setSession: vi.fn(),
      clearSession: vi.fn(),
      ...overrides,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      return selector ? selector(state) : state;
    });
  }

  it('renderiza formulário de login com campos de email e senha', async () => {
    setAuthState();
    vi.mocked(authService.session).mockResolvedValue({ authenticated: false, session: null });
    render(<LoginPageClient />);
    await waitFor(() => expect(authService.session).toHaveBeenCalled());
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('redireciona quando já existe sessão ativa', async () => {
    const session = createSession();
    setAuthState();
    vi.mocked(authService.session).mockResolvedValue({ authenticated: true, session });
    render(<LoginPageClient />);
    await waitFor(() => expect(authService.session).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin'));
  });

  it('autentica com credenciais válidas e redireciona', async () => {
    const user = userEvent.setup();
    const session = createSession();
    setAuthState();
    vi.mocked(authService.session).mockResolvedValue({ authenticated: false, session: null });
    vi.mocked(authService.login).mockResolvedValue({ authenticated: true, session });
    render(<LoginPageClient />);
    await waitFor(() => expect(authService.session).toHaveBeenCalled());
    await user.type(screen.getByLabelText(/e-mail/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'secret');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'secret' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin'));
  });

  it('exibe erro com credenciais inválidas', async () => {
    const user = userEvent.setup();
    setAuthState();
    vi.mocked(authService.session).mockResolvedValue({ authenticated: false, session: null });
    vi.mocked(authService.login).mockRejectedValue(new Error('Credenciais inválidas'));
    render(<LoginPageClient />);
    await waitFor(() => expect(authService.session).toHaveBeenCalled());
    await user.type(screen.getByLabelText(/e-mail/i), 'bad@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument());
  });
});
