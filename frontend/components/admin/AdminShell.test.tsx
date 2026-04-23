import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AdminShell from '@/components/admin/AdminShell';
import { authService } from '@/services/auth-service';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import type { AuthSessionPayload } from '@/types/identity';

vi.mock('next/navigation');
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (<a href={href} {...props}>{children}</a>) }));
vi.mock('@/services/auth-service');
vi.mock('@/stores/themeStore');
vi.mock('@/stores/authStore');

function createAdminSession(): AuthSessionPayload {
  return {
    access_token: 'tok',
    access_token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
    refresh_token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
    token_type: 'bearer',
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
      is_active: true,
      token_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null,
    },
  };
}

describe('AdminShell', () => {
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
    vi.mocked(usePathname).mockReturnValue('/admin/users');
    vi.mocked(useThemeStore).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn() } as unknown as ReturnType<typeof useThemeStore>);
  });

  function setAuthState(overrides: Partial<ReturnType<typeof useAuthStore>> = {}) {
    const state = {
      initialized: false,
      session: null as AuthSessionPayload | null,
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

  it('mostra tela de carregamento enquanto não inicializado', () => {
    setAuthState({ initialized: false, status: 'loading' });
    vi.mocked(authService.session).mockResolvedValue({ authenticated: false, session: null });
    render(<AdminShell>Conteúdo</AdminShell>);
    expect(screen.getByText(/carregando área administrativa/i)).toBeInTheDocument();
  });

  it('redireciona para login quando não há sessão', async () => {
    setAuthState({ initialized: true, status: 'unauthenticated', session: null });
    vi.mocked(authService.session).mockResolvedValue({ authenticated: false, session: null });
    render(<AdminShell>Conteúdo</AdminShell>);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fusers'));
  });

  it('redireciona para dashboard quando usuário não é admin', async () => {
    const session: AuthSessionPayload = {
      ...createAdminSession(),
      user: { ...createAdminSession().user, id: 2, name: 'User', role: 'user' },
    };
    setAuthState({ initialized: true, status: 'authenticated', session });
    render(<AdminShell>Conteúdo</AdminShell>);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('renderiza layout quando há sessão admin', () => {
    setAuthState({ initialized: true, status: 'authenticated', session: createAdminSession() });
    render(<AdminShell>Conteúdo</AdminShell>);
    expect(screen.getByText(/gestão do portal/i)).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  it('executa logout ao clicar em Sair', async () => {
    const user = userEvent.setup();
    setAuthState({ initialized: true, status: 'authenticated', session: createAdminSession() });
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    render(<AdminShell>Conteúdo</AdminShell>);
    await user.click(screen.getByRole('button', { name: /sair/i }));
    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });
});
