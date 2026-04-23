'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CheckboxField, InputField, SelectField } from '@/components/admin/forms/AdminFields';
import { usersService } from '@/services/user-service';
import type { ResetUserPasswordResponse, UserRole } from '@/types/user';

interface UserFormProps {
  userId?: string;
}

export default function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(userId);
  const numericUserId = userId ? Number(userId) : null;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isActive, setIsActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resetPayload, setResetPayload] = useState<ResetUserPasswordResponse | null>(null);

  const userQuery = useQuery({
    queryKey: ['admin', 'users', userId, numericUserId],
    queryFn: () => usersService.getById(numericUserId!),
    enabled: isEditing && numericUserId !== null && !Number.isNaN(numericUserId),
  });

  useEffect(() => {
    if (!userQuery.data) {
      return;
    }

    setName(userQuery.data.name);
    setEmail(userQuery.data.email);
    setRole(userQuery.data.role);
    setIsActive(userQuery.data.is_active);
  }, [userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && userId) {
        return usersService.update(numericUserId!, { name, email, role, is_active: isActive });
      }

      return usersService.create({ name, email, password, role, is_active: isActive });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      router.push('/admin/users');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => usersService.resetPassword(numericUserId!),
    onSuccess: (response) => {
      setResetPayload(response);
      setFeedback('Link de reset gerado com sucesso.');
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    await saveMutation.mutateAsync().catch((error: Error) => setFeedback(error.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">
            {isEditing ? 'Editar usuário' : 'Novo usuário'}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">Mantenha nome, e-mail e credenciais sob controle.</p>
        </div>
        <Link href="/admin/users" className="text-sm font-semibold text-secondary">
          Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-surface-container-low p-7 shadow-ambient">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nome" value={name} onChange={setName} />
          <InputField label="E-mail" type="email" value={email} onChange={setEmail} />
          <SelectField
            label="Perfil"
            value={role}
            onChange={(value) => setRole(value as UserRole)}
            options={[
              { value: 'user', label: 'Usuário' },
              { value: 'admin', label: 'Administrador' },
            ]}
          />
          {!isEditing ? (
            <InputField label="Senha" type="password" value={password} onChange={setPassword} />
          ) : null}
          {isEditing ? <CheckboxField label="Usuário ativo" checked={isActive} onChange={setIsActive} /> : null}
        </div>

        {feedback ? <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">{feedback}</div> : null}
        {userQuery.error instanceof Error ? <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{userQuery.error.message}</div> : null}

        <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">
          {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário'}
        </button>
      </form>

      {isEditing ? (
        <section className="rounded-3xl bg-surface-container-low p-7 shadow-ambient">
          <h3 className="font-headline text-xl font-bold text-primary">Reset de senha</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            O backend administrativo gera um token e um link temporário para redefinição da senha.
          </p>
          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={() => resetPasswordMutation.mutate()}
              className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
            >
              {resetPasswordMutation.isPending ? 'Gerando...' : 'Gerar link de reset'}
            </button>
          </div>

          {resetPayload ? (
            <div className="mt-5 space-y-3 rounded-2xl bg-surface-container-lowest p-5 text-sm text-on-surface">
              <p>
                <span className="font-semibold text-primary">Expira em:</span>{' '}
                {new Date(resetPayload.expires_at).toLocaleString('pt-BR')}
              </p>
              <div>
                <p className="mb-1 font-semibold text-primary">Token</p>
                <p className="break-all font-mono text-xs text-on-surface-variant">{resetPayload.reset_token}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-primary">Link</p>
                <a href={resetPayload.reset_url} target="_blank" rel="noreferrer" className="break-all text-secondary">
                  {resetPayload.reset_url}
                </a>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
