'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CheckboxField, InputField } from '@/components/admin/forms/AdminFields';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { getSaudeDayLabel, saudeYearOptions, saudeSyncResourceOptions } from '@/lib/saude-utils';
import { saudeService } from '@/services/saude-service';

import {
  buildCreatePayload,
  buildSchedulePayload,
  buildUpdatePayload,
  createEmptySchedules,
  createEmptyUnitFormValues,
  mapSchedulesToDrafts,
  mapUnitToFormValues,
  type SaudeScheduleDraft,
  type SaudeUnitFormValues,
} from './saude-units-form-helpers';

type ActiveFilter = 'all' | 'true' | 'false';

export default function SaudeUnitsAdminPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ tipo: '', search: '', ativo: 'all' as ActiveFilter });
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SaudeUnitFormValues>(createEmptyUnitFormValues());
  const [scheduleDrafts, setScheduleDrafts] = useState<SaudeScheduleDraft[]>(createEmptySchedules());
  const [syncYear, setSyncYear] = useState(saudeYearOptions[0]);

  const unitsQuery = useQuery({
    queryKey: ['admin', 'saude', 'units', filters],
    queryFn: () =>
      saudeService.listAdminUnits({
        tipo: filters.tipo || undefined,
        search: filters.search || undefined,
        ativo: filters.ativo === 'all' ? 'all' : filters.ativo === 'true',
      }),
  });

  const syncStatusQuery = useQuery({
    queryKey: ['admin', 'saude', 'sync-status'],
    queryFn: saudeService.getSyncStatus,
  });

  const scheduleQuery = useQuery({
    queryKey: ['admin', 'saude', 'unit-schedules', selectedUnitId],
    queryFn: () => saudeService.getUnitSchedules(selectedUnitId!),
    enabled: selectedUnitId !== null,
  });

  const selectedUnit = useMemo(
    () => unitsQuery.data?.items.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, unitsQuery.data?.items]
  );

  useEffect(() => {
    if (!selectedUnit) {
      setFormValues(createEmptyUnitFormValues());
      setScheduleDrafts(createEmptySchedules());
      return;
    }

    setFormValues(mapUnitToFormValues(selectedUnit));
  }, [selectedUnit]);

  useEffect(() => {
    if (scheduleQuery.data) {
      setScheduleDrafts(mapSchedulesToDrafts(scheduleQuery.data.schedules));
    }
  }, [scheduleQuery.data]);

  const refreshUnits = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'saude', 'units'] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'saude', 'sync-status'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const unit = selectedUnitId
        ? await saudeService.updateUnit(selectedUnitId, buildUpdatePayload(formValues))
        : await saudeService.createUnit(buildCreatePayload(formValues));
      await saudeService.updateUnitSchedules(unit.id, buildSchedulePayload(scheduleDrafts));
      return unit;
    },
    onSuccess: async (unit) => {
      setFeedback(selectedUnitId ? 'Unidade atualizada com sucesso.' : 'Unidade criada com sucesso.');
      setSelectedUnitId(unit.id);
      await refreshUnits();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => saudeService.deleteUnit(id),
    onSuccess: async () => {
      setFeedback('Unidade desativada com sucesso.');
      setSelectedUnitId(null);
      await refreshUnits();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const importMutation = useMutation({
    mutationFn: saudeService.importUnitsFromESaude,
    onSuccess: async (result) => {
      setFeedback(`Importação concluída: ${result.total} unidade(s), ${result.imported} nova(s).`);
      await refreshUnits();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      saudeService.triggerSync({
        years: [syncYear],
        resources: saudeSyncResourceOptions.map((option) => option.value),
      }),
    onSuccess: async (result) => {
      setFeedback(`Sync ${result.status}: ${result.synced_resources} recurso(s) sincronizado(s).`);
      await refreshUnits();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const handleFormChange = (field: keyof SaudeUnitFormValues, value: string | boolean) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleScheduleChange = (
    day: SaudeScheduleDraft['day_of_week'],
    field: keyof Omit<SaudeScheduleDraft, 'day_of_week'>,
    value: string | boolean
  ) => {
    setScheduleDrafts((current) =>
      current.map((schedule) =>
        schedule.day_of_week === day ? { ...schedule, [field]: value } : schedule
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">Saúde · Unidades</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            CRUD administrativo das unidades, horários, importação do E-Saúde e disparo de sincronização.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaudeSyncBadge value={syncStatusQuery.data?.last_success_at} />
          <button
            type="button"
            onClick={() => importMutation.mutate()}
            className="rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-on-secondary"
          >
            {importMutation.isPending ? 'Importando...' : 'Importar E-Saúde'}
          </button>
          <select
            value={syncYear}
            onChange={(event) => setSyncYear(Number(event.target.value))}
            className="rounded-xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface"
          >
            {saudeYearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary"
          >
            {syncMutation.isPending ? 'Sincronizando...' : 'Rodar sync'}
          </button>
        </div>
      </div>

      {feedback ? <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">{feedback}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <section className="space-y-4 rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Buscar unidade"
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface"
            />
            <input
              value={filters.tipo}
              onChange={(event) => setFilters((current) => ({ ...current, tipo: event.target.value }))}
              placeholder="Filtrar por tipo"
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface"
            />
            <select
              value={filters.ativo}
              onChange={(event) => setFilters((current) => ({ ...current, ativo: event.target.value as ActiveFilter }))}
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface"
            >
              <option value="all">Todas</option>
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-on-surface-variant">{unitsQuery.data?.total ?? 0} unidade(s)</p>
            <button
              type="button"
              onClick={() => {
                setSelectedUnitId(null);
                setFormValues(createEmptyUnitFormValues());
                setScheduleDrafts(createEmptySchedules());
              }}
              className="text-sm font-semibold text-secondary"
            >
              Nova unidade manual
            </button>
          </div>

          <div className="space-y-3">
            {unitsQuery.isLoading ? <p className="text-sm text-on-surface-variant">Carregando unidades...</p> : null}
            {unitsQuery.error instanceof Error ? <p className="text-sm text-red-300">{unitsQuery.error.message}</p> : null}
            {unitsQuery.data?.items.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  unit.id === selectedUnitId
                    ? 'border-primary bg-primary/5'
                    : 'border-outline/10 bg-surface-container-lowest hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{unit.name}</p>
                    <p className="text-sm text-on-surface-variant">{unit.unit_type}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${unit.is_active ? 'bg-primary/10 text-primary' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                    {unit.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">{unit.address}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-headline text-2xl font-bold text-primary">
                {selectedUnitId ? 'Editar unidade' : 'Cadastrar unidade'}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">Campos aceitos pelo backend V1.</p>
            </div>
            {selectedUnitId ? (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedUnitId)}
                className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"
              >
                {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InputField label="Nome" value={formValues.name} onChange={(value) => handleFormChange('name', value)} />
            <InputField label="Tipo" value={formValues.unit_type} onChange={(value) => handleFormChange('unit_type', value)} />
            <InputField label="Endereço" value={formValues.address} onChange={(value) => handleFormChange('address', value)} />
            <InputField label="Bairro" value={formValues.neighborhood} onChange={(value) => handleFormChange('neighborhood', value)} />
            <InputField label="Telefone" value={formValues.phone} onChange={(value) => handleFormChange('phone', value)} />
            <InputField label="Fonte" value={formValues.source} onChange={(value) => handleFormChange('source', value)} readOnly={Boolean(selectedUnitId)} />
            <InputField label="Latitude" value={formValues.latitude} onChange={(value) => handleFormChange('latitude', value)} />
            <InputField label="Longitude" value={formValues.longitude} onChange={(value) => handleFormChange('longitude', value)} />
          </div>

          <div className="mt-4">
            <CheckboxField label="Unidade ativa" checked={formValues.is_active} onChange={(checked) => handleFormChange('is_active', checked)} />
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <h4 className="font-headline text-lg font-bold text-primary">Horários</h4>
              <p className="text-sm text-on-surface-variant">Edite os sete dias e salve no mesmo fluxo.</p>
            </div>
            <div className="space-y-3">
              {scheduleDrafts.map((schedule) => (
                <div key={schedule.day_of_week} className="rounded-2xl bg-surface-container-lowest p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="font-medium text-on-surface">{getSaudeDayLabel(schedule.day_of_week)}</p>
                    <div className="grid gap-3 md:grid-cols-[140px_140px_auto] md:items-center">
                      <input
                        type="time"
                        value={schedule.opens_at}
                        disabled={schedule.is_closed}
                        onChange={(event) => handleScheduleChange(schedule.day_of_week, 'opens_at', event.target.value)}
                        className="rounded-xl border border-outline/20 bg-surface px-3 py-2 text-sm text-on-surface disabled:opacity-40"
                      />
                      <input
                        type="time"
                        value={schedule.closes_at}
                        disabled={schedule.is_closed}
                        onChange={(event) => handleScheduleChange(schedule.day_of_week, 'closes_at', event.target.value)}
                        className="rounded-xl border border-outline/20 bg-surface px-3 py-2 text-sm text-on-surface disabled:opacity-40"
                      />
                      <CheckboxField
                        label="Fechado"
                        checked={schedule.is_closed}
                        onChange={(checked) => handleScheduleChange(schedule.day_of_week, 'is_closed', checked)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-on-surface-variant">
              {scheduleQuery.isLoading && selectedUnitId ? 'Carregando horários da unidade...' : 'Pronto para salvar.'}
            </div>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary"
            >
              {saveMutation.isPending ? 'Salvando...' : selectedUnitId ? 'Salvar alterações' : 'Criar unidade'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
