'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin';
  const { initialized, session, setLoading, setSession, clearSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    authService
      .session()
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.authenticated && response.session) {
          setSession(response.session);
          router.replace(nextPath);
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
  }, [clearSession, nextPath, router, setSession]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    setLoading();

    try {
      const response = await authService.login({ email, password });

      if (!response.authenticated || !response.session) {
        throw new Error('Sessão não iniciada.');
      }

      setSession(response.session);
      router.replace(nextPath);
    } catch (error) {
      clearSession();
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialized && session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-low p-8 shadow-[0_32px_48px_-24px_rgba(0,25,60,0.35)]">
        <div className="mb-8 space-y-3 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">shield_lock</span>
          <h1 className="font-headline text-3xl font-extrabold text-primary">Acesso restrito</h1>
          <p className="text-sm text-on-surface-variant">
            Entre com suas credenciais para administrar usuários e obras públicas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">Senha</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-3 font-headline font-bold text-on-primary disabled:opacity-70"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
