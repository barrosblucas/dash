'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authService } from '@/services/auth-service';

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage('Token de redefinição não informado.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas informadas não coincidem.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.consumePasswordReset({
        reset_token: token,
        new_password: password,
      });

      setSuccessMessage(response.message || 'Senha atualizada com sucesso.');
      setPassword('');
      setConfirmPassword('');
      window.setTimeout(() => router.replace('/login'), 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível atualizar a senha.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-low p-8 shadow-[0_32px_48px_-24px_rgba(0,25,60,0.35)]">
        <div className="mb-8 space-y-3 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">lock_reset</span>
          <h1 className="font-headline text-3xl font-extrabold text-primary">
            Redefinir senha
          </h1>
          <p className="text-sm text-on-surface-variant">
            Informe sua nova senha para concluir o acesso à área restrita.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">Nova senha</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">Confirmar nova senha</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-xl bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {!token ? (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Token ausente. Solicite um novo link de redefinição ao administrador.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !token}
            className="w-full rounded-xl bg-primary px-4 py-3 font-headline font-bold text-on-primary disabled:opacity-70"
          >
            {submitting ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-on-surface-variant">
          <Link href="/login" className="font-semibold text-secondary">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
