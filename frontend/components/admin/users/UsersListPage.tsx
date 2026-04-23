'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { usersService } from '@/services/user-service';

export default function UsersListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: usersService.list,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">Usuários</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Controle de acesso para a área administrativa.
          </p>
        </div>

        <Link href="/admin/users/new" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">
          Novo usuário
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Nome</span>
          <span>E-mail</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {isLoading ? <p className="px-6 py-8 text-sm text-on-surface-variant">Carregando usuários...</p> : null}
        {error instanceof Error ? <p className="px-6 py-8 text-sm text-red-300">{error.message}</p> : null}

        {data?.users.map((user) => (
          <div key={user.id} className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr] gap-4 px-6 py-5 text-sm text-on-surface">
            <div>
              <p className="font-semibold text-primary">{user.name}</p>
              <p className="text-xs text-on-surface-variant">Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <p className="truncate">{user.email}</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${user.is_active ? 'bg-primary text-on-primary' : 'bg-tertiary-container text-on-tertiary-container'}`}>
              {user.is_active ? 'Ativo' : 'Inativo'}
            </span>
            <Link href={`/admin/users/${user.id}`} className="font-semibold text-secondary">
              Editar
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
