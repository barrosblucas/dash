'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { saudeService } from '@/services/saude-service';

const SaudeUnitsMap = dynamic(() => import('@/components/saude/SaudeUnitsMap'), {
  ssr: false,
  loading: () => <SaudeStateBlock type="loading" title="Carregando mapa das unidades..." />,
});

export default function UnidadesClient() {
  const [tipo, setTipo] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const unitsQuery = useQuery({
    queryKey: ['saude', 'units', tipo, search],
    queryFn: () => saudeService.listUnits({ tipo: tipo || undefined, search: search || undefined }),
  });

  const syncStatusQuery = useQuery({
    queryKey: ['saude', 'sync-status', 'units-page'],
    queryFn: saudeService.getSyncStatus,
  });

  const unitTypes = useMemo(
    () => Array.from(new Set((unitsQuery.data?.items ?? []).map((item) => item.unit_type))).sort(),
    [unitsQuery.data?.items]
  );

  useEffect(() => {
    if (unitsQuery.data?.items.length && selectedUnitId === null) {
      setSelectedUnitId(unitsQuery.data.items[0].id);
    }
  }, [selectedUnitId, unitsQuery.data?.items]);

  if (unitsQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando unidades de saúde..." />;
  }

  if (unitsQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar unidades" description={unitsQuery.error.message} />;
  }

  const units = unitsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary">Unidades de saúde</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Encontre a unidade mais próxima, filtre por tipo e consulte horários públicos cadastrados.
          </p>
        </div>
        <SaudeSyncBadge value={syncStatusQuery.data?.last_success_at ?? null} />
      </div>

      <section className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou endereço"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="">Todos os tipos</option>
            {unitTypes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setTipo('');
              setSearch('');
            }}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
          >
            Limpar
          </button>
        </div>
      </section>

      {units.length ? (
        <SaudeUnitsMap units={units} selectedUnitId={selectedUnitId} onSelectUnit={setSelectedUnitId} />
      ) : (
        <SaudeStateBlock type="empty" title="Nenhuma unidade encontrada" description="Ajuste os filtros para localizar outra unidade." />
      )}
    </div>
  );
}
