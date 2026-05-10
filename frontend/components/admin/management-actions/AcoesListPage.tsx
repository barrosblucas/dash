'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { managementActionsService } from '@/services/management-actions-service';
import type { ManagementAction } from '@/types/management-actions';

function statusConfig(status: 'concluída' | 'em andamento'): { classes: string; label: string } {
  return status === 'concluída'
    ? { classes: 'bg-green-900/30 text-green-300', label: 'Concluída' }
    : { classes: 'bg-amber-900/30 text-amber-300', label: 'Em andamento' };
}

function formatInvestment(item: ManagementAction): string {
  if (item.investment_raw >= 1_000_000) {
    return `R$ ${(item.investment_raw / 1_000_000).toFixed(1)}M`;
  }
  return `R$ ${item.investment_raw.toLocaleString('pt-BR')}`;
}

export default function AcoesListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'management-actions'],
    queryFn: () => managementActionsService.getActions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => managementActionsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'management-actions'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">Ações da Gestão</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Gerencie as ações exibidas no portal público /acoes.</p>
        </div>

        <Link href="/admin/acoes/new" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">
          Nova ação
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.5fr_1fr_0.6fr_0.8fr_0.6fr_0.8fr] gap-3 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Título</span>
          <span>Categoria</span>
          <span>Investimento</span>
          <span>Status</span>
          <span>Progresso</span>
          <span>Ações</span>
        </div>

        {isLoading ? <p className="px-6 py-8 text-sm text-on-surface-variant">Carregando ações...</p> : null}
        {error instanceof Error ? <p className="px-6 py-8 text-sm text-red-300">{error.message}</p> : null}

        {data?.items.length === 0 && !isLoading ? (
          <p className="px-6 py-8 text-sm text-on-surface-variant">Nenhuma ação cadastrada.</p>
        ) : null}

        {data?.items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.5fr_1fr_0.6fr_0.8fr_0.6fr_0.8fr] gap-3 border-t border-surface-container-high px-6 py-5 text-sm text-on-surface">
            <div>
              <p className="font-semibold text-primary truncate">{item.title}</p>
              <p className="text-xs text-on-surface-variant">{item.month} {item.year}</p>
            </div>
            <p className="truncate text-on-surface-variant">{item.category}</p>
            <p className="text-emerald-300 font-semibold">{formatInvestment(item)}</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusConfig(item.status).classes}`}>
              {statusConfig(item.status).label}
            </span>
            <p>{item.progress}%</p>
            <div className="flex items-center gap-3">
              <Link href={`/admin/acoes/${item.id}`} className="font-semibold text-secondary">
                Editar
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Excluir "${item.title}"?`)) {
                    deleteMutation.mutate(item.id);
                  }
                }}
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
