'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

const adminNavigation = [
  { href: '/admin', label: 'Painel', icon: 'shield_person' },
  { href: '/admin/users', label: 'Usuários', icon: 'group' },
  { href: '/admin/obras', label: 'Obras', icon: 'construction' },
  { href: '/admin/saude/unidades', label: 'Saúde', icon: 'local_hospital' },
  { href: '/admin/legislacoes', label: 'Legislações', icon: 'article' },
  { href: '/admin/diario-oficial', label: 'Diário Oficial', icon: 'newspaper' },
] as const;

interface AdminShellProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <div className="rounded-2xl bg-surface-container-low px-8 py-6 text-center shadow-ambient">
        <p className="font-headline text-lg font-bold text-primary">Carregando área administrativa...</p>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { initialized, session, status, setLoading, setSession, clearSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (initialized) {
      return undefined;
    }

    setLoading();

    authService
      .session()
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.authenticated && response.session) {
          setSession(response.session);
          return;
        }

        clearSession();
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      });

    return () => {
      active = false;
    };
  }, [clearSession, initialized, setLoading, setSession]);

  useEffect(() => {
    if (initialized && status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, pathname, router, status]);

  useEffect(() => {
    if (initialized && status === 'authenticated' && session?.user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [initialized, router, session?.user.role, status]);

  const userInitials = useMemo(() => {
    const name = session?.user.name ?? 'Admin';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [session?.user.name]);

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    clearSession();
    router.replace('/login');
  };

  if (
    !initialized ||
    status === 'loading' ||
    status === 'unauthenticated' ||
    session?.user.role !== 'admin'
  ) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-surface/90 px-4 py-4 backdrop-blur-2xl">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg bg-surface-container-low p-2.5"
          aria-label="Abrir menu administrativo"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <p className="font-headline font-bold text-primary">Admin</p>
      </div>

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-low p-6 transition-transform md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="font-headline text-xl font-bold text-primary">Área restrita</p>
              <p className="text-sm text-on-surface-variant">Gestão segura de conteúdo e acesso</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 md:hidden">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="space-y-2">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl bg-surface-container-lowest p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Sessão ativa</p>
            <p className="mt-2 font-headline text-lg font-bold text-primary">{session?.user.name}</p>
            <p className="text-sm text-on-surface-variant">{session?.user.email}</p>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu administrativo"
          />
        ) : null}

        <main className="flex-1 md:ml-72">
          <div className="sticky top-0 z-30 flex items-center justify-between bg-surface/90 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-on-surface-variant">Administração</p>
              <h1 className="font-headline text-2xl font-bold text-primary">Gestão do portal</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                <span className="material-symbols-outlined align-middle text-[18px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <div className="hidden rounded-full bg-primary px-3 py-2 text-sm font-bold text-on-primary sm:block">
                {userInitials}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
