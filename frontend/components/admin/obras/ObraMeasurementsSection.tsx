'use client';

import { InputField, TextareaField } from '@/components/admin/forms/AdminFields';
import type { ObraMedicao } from '@/types/obra';

import ObraMediaEditor from './ObraMediaEditor';
import type { PendingUpload } from './obra-form-helpers';
import { parseLocaleNumber, toInputValue } from './obra-form-helpers';

interface ObraMeasurementsSectionProps {
  medicoes: ObraMedicao[];
  pendingMeasurementUploads: Record<number, PendingUpload[]>;
  onAddMeasurement: () => void;
  onRemoveMeasurement: (index: number) => void;
  onChangeMeasurement: (index: number, nextMeasurement: ObraMedicao) => void;
  onRemoveMedia: (sequence: number, mediaIndex: number) => void;
  onFilesSelected: (files: FileList | null, sequence: number) => void;
  onPendingChange: (sequence: number, key: string, field: 'titulo' | 'media_kind', value: string) => void;
  onPendingRemove: (sequence: number, key: string) => void;
}

export default function ObraMeasurementsSection({
  medicoes,
  pendingMeasurementUploads,
  onAddMeasurement,
  onRemoveMeasurement,
  onChangeMeasurement,
  onRemoveMedia,
  onFilesSelected,
  onPendingChange,
  onPendingRemove,
}: ObraMeasurementsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-headline text-lg font-bold text-primary">Medições</h3>
        <button type="button" onClick={onAddMeasurement} className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">
          Adicionar medição
        </button>
      </div>

      <div className="space-y-4">
        {medicoes.map((medicao, index) => (
          <div key={medicao.id ?? medicao.sequencia} className="space-y-4 rounded-2xl bg-surface-container-lowest p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-primary">Medição {medicao.sequencia}</p>
              <button type="button" onClick={() => onRemoveMeasurement(index)} className="text-sm font-semibold text-tertiary">
                Remover
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InputField label="Sequência" value={medicao.sequencia} onChange={() => undefined} readOnly />
              <InputField
                label="Mês da medição"
                type="number"
                min={1}
                max={12}
                value={medicao.mes_referencia}
                onChange={(value) => onChangeMeasurement(index, { ...medicao, mes_referencia: Number(value) || 1 })}
              />
              <InputField
                label="Ano da medição"
                type="number"
                min={2000}
                value={medicao.ano_referencia}
                onChange={(value) => onChangeMeasurement(index, { ...medicao, ano_referencia: Number(value) || new Date().getFullYear() })}
              />
              <InputField
                label="Valor da medição"
                value={toInputValue(medicao.valor_medicao)}
                onChange={(value) => onChangeMeasurement(index, { ...medicao, valor_medicao: parseLocaleNumber(value) ?? 0 })}
              />
            </div>

            <TextareaField
              label="Observação da medição"
              value={medicao.observacao ?? ''}
              onChange={(value) => onChangeMeasurement(index, { ...medicao, observacao: value })}
              rows={3}
            />

            <ObraMediaEditor
              items={medicao.media_assets}
              onChange={(mediaIndex, nextMedia) => onChangeMeasurement(index, {
                ...medicao,
                media_assets: mediaIndex === medicao.media_assets.length
                  ? [...medicao.media_assets, nextMedia]
                  : medicao.media_assets.map((item, currentIndex) => currentIndex === mediaIndex ? nextMedia : item),
              })}
              onRemove={(mediaIndex) => onRemoveMedia(medicao.sequencia, mediaIndex)}
              onFilesSelected={(files) => onFilesSelected(files, medicao.sequencia)}
              pendingUploads={pendingMeasurementUploads[medicao.sequencia] ?? []}
              onPendingChange={(key, field, value) => onPendingChange(medicao.sequencia, key, field, value)}
              onPendingRemove={(key) => onPendingRemove(medicao.sequencia, key)}
              inputLabel="Upload de fotos ou anexos da medição"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
