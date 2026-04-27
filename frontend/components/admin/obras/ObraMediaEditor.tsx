'use client';

import { useState } from 'react';

import { InputField } from '@/components/admin/forms/AdminFields';
import type { ObraMediaAsset } from '@/types/obra';

import type { PendingUpload } from './obra-form-helpers';

interface ObraMediaEditorProps {
  items: ObraMediaAsset[];
  onChange: (index: number, nextMedia: ObraMediaAsset) => void;
  onRemove: (index: number) => void;
  onFilesSelected: (files: FileList | null) => void;
  pendingUploads: PendingUpload[];
  onPendingChange: (key: string, field: 'titulo' | 'media_kind', value: string) => void;
  onPendingRemove: (key: string) => void;
  inputLabel: string;
}

export default function ObraMediaEditor({
  items,
  onChange,
  onRemove,
  onFilesSelected,
  pendingUploads,
  onPendingChange,
  onPendingRemove,
  inputLabel,
}: ObraMediaEditorProps) {
  const [fileInputKey, setFileInputKey] = useState(0);

  return (
    <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Mídias vinculadas</p>
        <button
          type="button"
          onClick={() => onChange(items.length, { titulo: '', media_kind: 'image', source_type: 'url', url: '' })}
          className="rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-on-secondary"
        >
          Adicionar link
        </button>
      </div>

      {items.map((media, index) => (
        <div key={media.id ?? `${media.source_type}-${index}`} className="grid gap-3 rounded-2xl border border-outline/10 bg-surface p-4 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-3">
            <InputField label="Título da mídia" value={media.titulo ?? ''} onChange={(value) => onChange(index, { ...media, titulo: value })} />
            {media.source_type === 'url' ? (
              <InputField label="URL da mídia" value={media.url ?? ''} onChange={(value) => onChange(index, { ...media, url: value, source_type: 'url' })} />
            ) : (
              <InputField label="Arquivo vinculado" value={media.original_name ?? media.url ?? 'Upload salvo'} onChange={() => undefined} readOnly />
            )}
          </div>
          <InputField label="Categoria da mídia" value={media.media_kind} onChange={(value) => onChange(index, { ...media, media_kind: value })} />
          <div className="flex items-end">
            <button type="button" onClick={() => onRemove(index)} className="w-full rounded-xl bg-tertiary-container px-4 py-3 text-sm font-bold text-on-tertiary-container">
              Remover
            </button>
          </div>
        </div>
      ))}

      <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
        <span className="font-label font-medium text-on-surface">{inputLabel}</span>
        <input
          key={fileInputKey}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(event) => {
            onFilesSelected(event.target.files);
            setFileInputKey((prev) => prev + 1);
          }}
          className="rounded-xl border border-outline/40 bg-surface px-4 py-3 text-sm text-on-surface"
        />
      </label>

      {pendingUploads.map((upload) => (
        <div key={upload.key} className="grid gap-3 rounded-2xl border border-dashed border-outline/20 bg-surface p-4 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-3">
            <InputField label="Título do upload" value={upload.titulo} onChange={(value) => onPendingChange(upload.key, 'titulo', value)} />
            <InputField label="Arquivo selecionado" value={upload.file.name} onChange={() => undefined} readOnly />
          </div>
          <InputField label="Categoria do upload" value={upload.media_kind} onChange={(value) => onPendingChange(upload.key, 'media_kind', value)} />
          <div className="flex items-end">
            <button type="button" onClick={() => onPendingRemove(upload.key)} className="w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface">
              Remover
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
