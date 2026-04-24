'use client';

import { useQuery } from '@tanstack/react-query';

import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import { formatSyncLogLabel } from '@/lib/saude-utils';
import { saudeService } from '@/services/saude-service';

export default function AdminSaudeSyncPanel() {
  const syncStatusQuery = useQuery({
    queryKey: ['saude', 'sync-status', 'admin'],
    queryFn: saudeService.getSyncStatus,
  });

  if (syncStatusQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando status da sincronização..." />;
  }

  if (syncStatusQuery.error instanceof Error) {
    return (
      <SaudeStateBlock
        type="error"
        title="Não foi possível carregar o status"
        description={syncStatusQuery.error.message}
      />
    );
  }

  const syncStatus = syncStatusQuery.data;

  return (
    <div className="space-y-6">
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface-container-lowest p-5">
          <p className="text-sm text-on-surface-variant">Status da rotina</p>
          <p className="mt-2 font-headline text-2xl font-bold text-primary">
            {syncStatus?.running ? 'Sincronizando agora' : 'Aguardando próxima execução'}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5">
          <p className="text-sm text-on-surface-variant">Próxima execução</p>
          <p className="mt-2 font-headline text-2xl font-bold text-primary">
            {syncStatus?.next_run_at ? new Date(syncStatus.next_run_at).toLocaleString('pt-BR') : 'Não agendada'}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5">
          <p className="text-sm text-on-surface-variant">Snapshots disponíveis</p>
          <p className="mt-2 font-headline text-2xl font-bold text-primary">{syncStatus?.snapshots.length ?? 0}</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold text-primary">Snapshots recentes</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Últimos recursos sincronizados pelo backend.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {syncStatus?.snapshots.length ? (
              syncStatus.snapshots.slice(0, 8).map((snapshot) => (
                <div
                  key={`${snapshot.resource}-${snapshot.scope_year ?? 'global'}`}
                  className="flex flex-col gap-1 rounded-2xl bg-surface-container-lowest px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <p className="font-medium text-on-surface">{snapshot.resource}</p>
                  <p className="text-sm text-on-surface-variant">
                    {snapshot.scope_year ? `Ano ${snapshot.scope_year} · ` : ''}
                    {new Date(snapshot.synced_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            ) : (
              <SaudeStateBlock type="empty" title="Nenhum snapshot disponível" />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h2 className="font-headline text-2xl font-bold text-primary">Logs recentes</h2>
          <div className="mt-5 space-y-3">
            {syncStatus?.recent_logs.length ? (
              syncStatus.recent_logs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-2xl bg-surface-container-lowest px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-on-surface">{formatSyncLogLabel(log)}</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Início: {new Date(log.started_at).toLocaleString('pt-BR')}
                  </p>
                  {log.error_message ? <p className="mt-1 text-xs text-red-300">{log.error_message}</p> : null}
                </div>
              ))
            ) : (
              <SaudeStateBlock type="empty" title="Nenhum log disponível" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
