'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { legislacaoAdminService } from '@/services/legislacao-service';
import type { LegislacaoItem, StatusLegislacao, TipoLegislacao } from '@/types/legislacao';

function formatTipo(tipo: TipoLegislacao): string {
  const map: Record<TipoLegislacao, string> = {
    LEI: 'Lei',
    LEI_COMPLEMENTAR: 'Lei Complementar',
    DECRETO: 'Decreto',
    DECRETO_LEI: 'Decreto-Lei',
    PORTARIA: 'Portaria',
    RESOLUCAO: 'Resolução',
    EMENDA: 'Emenda',
  };
  return map[tipo] ?? tipo;
}

function formatNumero(item: LegislacaoItem): string {
  return `${formatTipo(item.tipo)} nº ${item.numero}/${item.ano}`;
}

function statusConfig(status: StatusLegislacao): { classes: string; label: string } {
  const configs: Record<StatusLegislacao, { classes: string; label: string }> = {
    ATIVA: { classes: 'bg-green-900/30 text-green-300', label: 'Ativa' },
    REVOGADA: { classes: 'bg-red-900/30 text-red-300', label: 'Revogada' },
    ALTERADA: { classes: 'bg-yellow-900/30 text-yellow-300', label: 'Alterada' },
  };
  return configs[status] ?? { classes: 'bg-gray-700 text-gray-300', label: status };
}

export default function LegislacoesListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'legislacoes'],
    queryFn: () => legislacaoAdminService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => legislacaoAdminService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'legislacoes'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">Legislações</h2>
          <p className="mt-2 text-sm text-on-surface-variant">CRUD administrativo de legislações municipais.</p>
        </div>

        <Link href="/admin/legislacoes/new" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">
          Nova legislação
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface-container-low shadow-ambient">
        <div className="grid grid-cols-[1.2fr_1.8fr_0.7fr_0.8fr_0.8fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Identificação</span>
          <span>Ementa</span>
          <span>Ano</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {isLoading ? <p className="px-6 py-8 text-sm text-on-surface-variant">Carregando legislações...</p> : null}
        {error instanceof Error ? <p className="px-6 py-8 text-sm text-red-300">{error.message}</p> : null}

        {data?.items.length === 0 && !isLoading ? (
          <p className="px-6 py-8 text-sm text-on-surface-variant">Nenhuma legislação cadastrada.</p>
        ) : null}

        {data?.items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.2fr_1.8fr_0.7fr_0.8fr_0.8fr] gap-4 border-t border-surface-container-high px-6 py-5 text-sm text-on-surface">
            <div>
              <p className="font-semibold text-primary">{formatNumero(item)}</p>
            </div>
            <p className="truncate text-on-surface-variant">{item.ementa}</p>
            <p>{item.ano}</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusConfig(item.status).classes}`}>
              {statusConfig(item.status).label}
            </span>
            <div className="flex items-center gap-4">
              <Link href={`/admin/legislacoes/${item.id}`} className="font-semibold text-secondary">
                Editar
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Excluir ${formatNumero(item)}?`)) {
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
