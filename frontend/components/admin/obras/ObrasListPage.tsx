'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { formatCurrency, obraStatusLabels } from '@/lib/obra-formatters';
import { obrasService } from '@/services/obra-service';

export default function ObrasListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'obras'],
    queryFn: () => obrasService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (hash: string) => obrasService.remove(hash),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'obras'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">Obras</h2>
          <p className="mt-2 text-sm text-on-surface-variant">CRUD administrativo com atualização de medições mensais.</p>
        </div>

        <Link href="/admin/obras/new" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">
          Nova obra
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.4fr_0.9fr_1fr_0.9fr_1fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Título</span>
          <span>Status</span>
          <span>Secretaria</span>
          <span>Total medido</span>
          <span>Ações</span>
        </div>

        {isLoading ? <p className="px-6 py-8 text-sm text-on-surface-variant">Carregando obras...</p> : null}
        {error instanceof Error ? <p className="px-6 py-8 text-sm text-red-300">{error.message}</p> : null}

        {data?.obras.map((obra) => (
          <div key={obra.hash} className="grid grid-cols-[1.4fr_0.9fr_1fr_0.9fr_1fr] gap-4 px-6 py-5 text-sm text-on-surface">
            <div>
              <p className="font-semibold text-primary">{obra.titulo}</p>
              <p className="text-xs text-on-surface-variant">{obra.hash}</p>
            </div>
            <span className="w-fit rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-bold text-on-surface">
              {obraStatusLabels[obra.status]}
            </span>
            <p>{obra.secretaria}</p>
            <p>{formatCurrency(obra.valor_medido_total)}</p>
            <div className="flex items-center gap-4">
              <Link href={`/admin/obras/${obra.hash}`} className="font-semibold text-secondary">
                Editar
              </Link>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(obra.hash)}
                className="font-semibold text-red-300"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
