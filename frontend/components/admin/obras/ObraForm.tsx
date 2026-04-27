'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { InputField, SelectField, TextareaField } from '@/components/admin/forms/AdminFields';
import ObraLocationsMap from '@/components/admin/obras/ObraLocationsMap';
import ObraMeasurementsSection from '@/components/admin/obras/ObraMeasurementsSection';
import ObraMediaEditor from '@/components/admin/obras/ObraMediaEditor';
import {
  buildPayload,
  createEmptyObra,
  createFundingSource,
  createLocation,
  createMeasurement,
  financialFields,
  parseLocaleNumber,
  statusOptions,
  toInputValue,
  type PendingUpload,
  validatePayload,
  withDefaultArrays,
} from '@/components/admin/obras/obra-form-helpers';
import { formatCurrency } from '@/lib/obra-formatters';
import { obrasService } from '@/services/obra-service';
import type { ObraFundingSource, ObraLocation, ObraMedicao, ObraStatus, ObraUpsertPayload } from '@/types/obra';

interface ObraFormProps {
  obraHash?: string;
}

const createPendingUploads = (files: FileList | null, scope: 'global' | number): PendingUpload[] => {
  if (!files?.length) {
    return [];
  }
  return Array.from(files).map((file) => ({
    key: `${scope}-${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
    file,
    titulo: file.name.replace(/\.[^.]+$/, ''),
    media_kind: file.type.includes('pdf') ? 'document' : 'image',
  }));
};

const remapSequences = <T extends { sequencia: number }>(items: T[]) => (
  items.map((item, index) => ({ ...item, sequencia: index + 1 }))
);

type NumericField =
  | 'valor_orcamento'
  | 'valor_original'
  | 'valor_aditivo'
  | 'valor_homologado'
  | 'valor_contrapartida'
  | 'valor_convenio'
  | 'progresso_fisico'
  | 'progresso_financeiro';

export default function ObraForm({ obraHash }: ObraFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(obraHash);
  const [form, setForm] = useState<ObraUpsertPayload>(createEmptyObra());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [pendingGlobalUploads, setPendingGlobalUploads] = useState<PendingUpload[]>([]);
  const [pendingMeasurementUploads, setPendingMeasurementUploads] = useState<Record<number, PendingUpload[]>>({});

  const obraQuery = useQuery({
    queryKey: ['admin', 'obras', obraHash],
    queryFn: () => obrasService.getByHash(obraHash!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!obraQuery.data) {
      return;
    }
    setForm(withDefaultArrays(obraQuery.data));
    setActiveLocationIndex(0);
    setPendingGlobalUploads([]);
    setPendingMeasurementUploads({});
  }, [obraQuery.data]);

  const totalMedido = useMemo(
    () => form.medicoes.reduce((total, medicao) => total + medicao.valor_medicao, 0),
    [form.medicoes]
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: ObraUpsertPayload) => {
      const saved = isEditing && obraHash
        ? await obrasService.update(obraHash, payload)
        : await obrasService.create(payload);

      for (const upload of pendingGlobalUploads) {
        await obrasService.uploadMedia(saved.hash, {
          file: upload.file,
          titulo: upload.titulo || undefined,
          media_kind: upload.media_kind,
        });
      }

      for (const medicao of saved.medicoes) {
        const uploads = pendingMeasurementUploads[medicao.sequencia] ?? [];
        for (const upload of uploads) {
          await obrasService.uploadMedia(saved.hash, {
            file: upload.file,
            titulo: upload.titulo || undefined,
            media_kind: upload.media_kind,
            medicao_id: medicao.id ?? null,
          });
        }
      }

      return saved;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'obras'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'obras', obraHash] }),
        queryClient.invalidateQueries({ queryKey: ['public', 'obras'] }),
      ]);
      router.push('/admin/obras');
    },
  });

  const updateField = <K extends keyof ObraUpsertPayload>(field: K, value: ObraUpsertPayload[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateNumericField = (field: NumericField, value: string) => {
    updateField(field, parseLocaleNumber(value));
  };

  const updateLocation = (index: number, nextLocation: ObraLocation) => {
    setForm((current) => ({
      ...current,
      locations: current.locations.map((location, currentIndex) => currentIndex === index ? nextLocation : location),
    }));
  };

  const updateFundingSource = (index: number, nextSource: ObraFundingSource) => {
    setForm((current) => ({
      ...current,
      funding_sources: current.funding_sources.map((source, currentIndex) => currentIndex === index ? nextSource : source),
    }));
  };

  const updateMeasurement = (index: number, nextMeasurement: ObraMedicao) => {
    setForm((current) => ({
      ...current,
      medicoes: current.medicoes.map((medicao, currentIndex) => currentIndex === index ? nextMeasurement : medicao),
    }));
  };

  const addMeasurement = () => {
    setForm((current) => ({ ...current, medicoes: [...current.medicoes, createMeasurement(current.medicoes.length + 1)] }));
  };

  const removeMeasurement = (index: number) => {
    const nextMeasurements = remapSequences(form.medicoes.filter((_, currentIndex) => currentIndex !== index));
    setForm((current) => ({ ...current, medicoes: nextMeasurements }));
    setPendingMeasurementUploads((current) => nextMeasurements.reduce<Record<number, PendingUpload[]>>((accumulator, medicao, currentIndex) => {
      const previousSequence = currentIndex >= index ? medicao.sequencia + 1 : medicao.sequencia;
      accumulator[medicao.sequencia] = current[previousSequence] ?? [];
      return accumulator;
    }, {}));
  };

  const removeMedia = async (scope: 'global' | number, mediaIndex: number) => {
    const media = scope === 'global'
      ? form.media_assets[mediaIndex]
      : form.medicoes.find((medicao) => medicao.sequencia === scope)?.media_assets[mediaIndex];
    if (!media) {
      return;
    }
    if (obraHash && media.id && media.source_type === 'upload') {
      await obrasService.deleteMedia(obraHash, media.id);
    }
    if (scope === 'global') {
      setForm((current) => ({ ...current, media_assets: current.media_assets.filter((_, index) => index !== mediaIndex) }));
      return;
    }
    setForm((current) => ({
      ...current,
      medicoes: current.medicoes.map((medicao) => (
        medicao.sequencia === scope
          ? { ...medicao, media_assets: medicao.media_assets.filter((_, index) => index !== mediaIndex) }
          : medicao
      )),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const payload = buildPayload(form);
    const validationError = validatePayload(payload);
    if (validationError) {
      setFeedback(validationError);
      return;
    }
    await saveMutation.mutateAsync(payload).catch((error: Error) => setFeedback(error.message));
  };

  const activeLocation = form.locations[activeLocationIndex] ?? form.locations[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">{isEditing ? 'Editar obra' : 'Nova obra'}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Cadastro completo com locais, fontes, fotos e anexos por obra e por medição.</p>
        </div>
        <Link href="/admin/obras" className="text-sm font-semibold text-secondary">Voltar</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl bg-surface-container-low p-7 shadow-ambient">
        <section className="space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary">Informações básicas</h3>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-3">
            <InputField label="Título" value={form.titulo} onChange={(value) => updateField('titulo', value)} />
            <SelectField label="Status" value={form.status} onChange={(value) => updateField('status', value as ObraStatus)} options={statusOptions.map((option) => ({ ...option }))} />
            <InputField label="Secretaria" value={form.secretaria} onChange={(value) => updateField('secretaria', value)} />
            <InputField label="Órgão" value={form.orgao} onChange={(value) => updateField('orgao', value)} />
            <InputField label="Contrato" value={form.contrato} onChange={(value) => updateField('contrato', value)} />
            <InputField label="Tipo da obra" value={form.tipo_obra} onChange={(value) => updateField('tipo_obra', value)} />
            <InputField label="Modalidade" value={form.modalidade} onChange={(value) => updateField('modalidade', value)} />
            <InputField label="Data de início" type="date" value={form.data_inicio} onChange={(value) => updateField('data_inicio', value)} />
            <InputField label="Previsão de término" type="date" value={form.previsao_termino ?? ''} onChange={(value) => updateField('previsao_termino', value || null)} />
            <InputField label="Data de término" type="date" value={form.data_termino ?? ''} onChange={(value) => updateField('data_termino', value || null)} />
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-5">
            <TextareaField label="Descrição" value={form.descricao} onChange={(value) => updateField('descricao', value)} rows={5} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-headline text-lg font-bold text-primary">Locais e mapa</h3>
            <button type="button" onClick={() => {
              setForm((current) => ({ ...current, locations: [...current.locations, createLocation(current.locations.length + 1)] }));
              setActiveLocationIndex(form.locations.length);
            }} className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Adicionar local</button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-4">
              {form.locations.map((location, index) => (
                <button key={location.id ?? `${location.sequencia}-${index}`} type="button" onClick={() => setActiveLocationIndex(index)} className={`w-full rounded-2xl border p-4 text-left ${index === activeLocationIndex ? 'border-primary bg-primary/5' : 'border-outline/10 bg-surface'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-primary">Local {index + 1}</p>
                    {form.locations.length > 1 ? (
                      <span onClick={(event) => {
                        event.stopPropagation();
                        setForm((current) => ({ ...current, locations: remapSequences(current.locations.filter((_, currentIndex) => currentIndex !== index)) }));
                        setActiveLocationIndex((current) => Math.max(0, Math.min(current, form.locations.length - 2)));
                      }} className="cursor-pointer text-xs font-semibold text-tertiary">Remover</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{location.logradouro || 'Defina o endereço e clique no mapa para posicionar o pin.'}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InputField label="Logradouro do local" value={activeLocation.logradouro} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, logradouro: value })} />
                <InputField label="Bairro do local" value={activeLocation.bairro} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, bairro: value })} />
                <InputField label="CEP do local" value={activeLocation.cep} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, cep: value })} />
                <InputField label="Número do local" value={activeLocation.numero} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, numero: value })} />
                <InputField label="Latitude" value={toInputValue(activeLocation.latitude)} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, latitude: parseLocaleNumber(value) })} />
                <InputField label="Longitude" value={toInputValue(activeLocation.longitude)} onChange={(value) => updateLocation(activeLocationIndex, { ...activeLocation, longitude: parseLocaleNumber(value) })} />
              </div>
              <ObraLocationsMap locations={form.locations} activeLocationIndex={activeLocationIndex} onPickCoordinates={(index, latitude, longitude) => updateLocation(index, { ...form.locations[index], latitude, longitude })} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-headline text-lg font-bold text-primary">Fontes de recurso</h3>
            <button type="button" onClick={() => setForm((current) => ({ ...current, funding_sources: [...current.funding_sources, createFundingSource(current.funding_sources.length + 1)] }))} className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Adicionar fonte</button>
          </div>
          <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-5">
            {form.funding_sources.map((source, index) => (
              <div key={source.id ?? `${source.sequencia}-${index}`} className="grid gap-4 rounded-2xl border border-outline/10 bg-surface p-4 md:grid-cols-[1fr_220px_auto]">
                <InputField label="Fonte de recurso" value={source.nome} onChange={(value) => updateFundingSource(index, { ...source, nome: value })} />
                <InputField label="Valor da fonte" value={toInputValue(source.valor)} onChange={(value) => updateFundingSource(index, { ...source, valor: parseLocaleNumber(value) })} />
                <div className="flex items-end">
                  <button type="button" disabled={form.funding_sources.length === 1} onClick={() => setForm((current) => ({ ...current, funding_sources: remapSequences(current.funding_sources.filter((_, currentIndex) => currentIndex !== index)) }))} className="w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface disabled:opacity-50">Remover</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary">Progresso e valores</h3>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-4">
            <InputField label="Progresso físico (%)" value={toInputValue(form.progresso_fisico)} onChange={(value) => updateNumericField('progresso_fisico', value)} />
            <InputField label="Progresso financeiro (%)" value={toInputValue(form.progresso_financeiro)} onChange={(value) => updateNumericField('progresso_financeiro', value)} />
            <InputField label="Valor economizado (somente leitura)" value={formatCurrency(obraQuery.data?.valor_economizado ?? null)} onChange={() => undefined} readOnly />
            <InputField label="Valor medido total (prévia)" value={formatCurrency(totalMedido)} onChange={() => undefined} readOnly />
          </div>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-3">
            {financialFields.map(([field, label]) => (
              <InputField key={field} label={label} value={toInputValue(form[field])} onChange={(value) => updateNumericField(field, value)} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary">Fotos e anexos da obra</h3>
          <ObraMediaEditor
            items={form.media_assets}
            onChange={(index, nextMedia) => setForm((current) => ({
              ...current,
              media_assets: index === current.media_assets.length
                ? [...current.media_assets, nextMedia]
                : current.media_assets.map((item, currentIndex) => currentIndex === index ? nextMedia : item),
            }))}
            onRemove={(index) => void removeMedia('global', index)}
            onFilesSelected={(files) => setPendingGlobalUploads((current) => [...current, ...createPendingUploads(files, 'global')])}
            pendingUploads={pendingGlobalUploads}
            onPendingChange={(key, field, value) => setPendingGlobalUploads((current) => current.map((upload) => upload.key === key ? { ...upload, [field]: value } : upload))}
            onPendingRemove={(key) => setPendingGlobalUploads((current) => current.filter((upload) => upload.key !== key))}
            inputLabel="Upload de fotos ou anexos da obra"
          />
        </section>

        <ObraMeasurementsSection
          medicoes={form.medicoes}
          pendingMeasurementUploads={pendingMeasurementUploads}
          onAddMeasurement={addMeasurement}
          onRemoveMeasurement={removeMeasurement}
          onChangeMeasurement={updateMeasurement}
          onRemoveMedia={(sequence, mediaIndex) => void removeMedia(sequence, mediaIndex)}
          onFilesSelected={(files, sequence) => setPendingMeasurementUploads((current) => ({ ...current, [sequence]: [...(current[sequence] ?? []), ...createPendingUploads(files, sequence)] }))}
          onPendingChange={(sequence, key, field, value) => setPendingMeasurementUploads((current) => ({
            ...current,
            [sequence]: (current[sequence] ?? []).map((upload) => upload.key === key ? { ...upload, [field]: value } : upload),
          }))}
          onPendingRemove={(sequence, key) => setPendingMeasurementUploads((current) => ({
            ...current,
            [sequence]: (current[sequence] ?? []).filter((upload) => upload.key !== key),
          }))}
        />

        {feedback ? <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error">{feedback}</div> : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/obras" className="rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface">Cancelar</Link>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">
            <span className="material-symbols-outlined text-[18px]">{saveMutation.isPending ? 'sync' : 'save'}</span>
            {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Salvar obra' : 'Criar obra'}
          </button>
        </div>
      </form>
    </div>
  );
}
