'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { InputField, SelectField, TextareaField } from '@/components/admin/forms/AdminFields';
import { managementActionsService } from '@/services/management-actions-service';
import type { ManagementActionCreatePayload } from '@/types/management-actions';

const statusOptions = [
  { value: 'concluída' as const, label: 'Concluída' },
  { value: 'em andamento' as const, label: 'Em andamento' },
];

const categoryOptions = [
  { value: 'Infraestrutura', label: 'Infraestrutura' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Lazer', label: 'Lazer' },
  { value: 'Urbanismo', label: 'Urbanismo' },
  { value: 'Educação', label: 'Educação' },
  { value: 'Saneamento', label: 'Saneamento' },
  { value: 'Assistência', label: 'Assistência' },
];

interface ActionFormProps {
  actionId?: string;
}

function createEmpty(): ManagementActionCreatePayload {
  return {
    title: '',
    description: null,
    category: 'Infraestrutura',
    category_icon: 'construction',
    investment_raw: 0,
    impact_label: '',
    impact_number: 0,
    impact_suffix: '',
    image: null,
    month: 'Janeiro',
    year: String(new Date().getFullYear()),
    status: 'em andamento',
    color: '#3b82f6',
    progress: 0,
  };
}

export default function ActionForm({ actionId }: ActionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(actionId);
  const [form, setForm] = useState<ManagementActionCreatePayload>(createEmpty());
  const [feedback, setFeedback] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['admin', 'management-actions', actionId],
    queryFn: () => managementActionsService.getActions(),
    enabled: isEditing,
    select: (data) => data.items.find((a) => String(a.id) === actionId),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const a = detailQuery.data;
    setForm({
      title: a.title,
      description: a.description,
      category: a.category,
      category_icon: a.category_icon,
      investment_raw: a.investment_raw,
      impact_label: a.impact_label,
      impact_number: a.impact_number,
      impact_suffix: a.impact_suffix,
      image: a.image,
      month: a.month,
      year: a.year,
      status: a.status,
      color: a.color,
      progress: a.progress,
    });
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ManagementActionCreatePayload) => {
      if (isEditing) {
        return managementActionsService.update(Number(actionId), payload);
      }
      return managementActionsService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'management-actions'] });
      setFeedback(isEditing ? 'Ação atualizada com sucesso!' : 'Ação criada com sucesso!');
      setTimeout(() => {
        router.push('/admin/acoes');
      }, 800);
    },
    onError: (err: Error) => {
      setFeedback(`Erro: ${err.message}`);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    saveMutation.mutate(form);
  };

  const update = <K extends keyof ManagementActionCreatePayload>(field: K, value: ManagementActionCreatePayload[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isEditing && detailQuery.isLoading) {
    return <p className="text-sm text-on-surface-variant">Carregando dados da ação...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/acoes" className="text-sm font-semibold text-secondary">
          ← Voltar para lista
        </Link>
        <h2 className="mt-2 font-headline text-2xl font-extrabold text-primary">
          {isEditing ? 'Editar ação' : 'Nova ação'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Identificação</h3>
          <div className="space-y-4">
            <InputField
              label="Título"
              value={form.title}
              onChange={(v) => update('title', v)}
            />
            <TextareaField
              label="Descrição"
              value={form.description ?? ''}
              onChange={(v) => update('description', v || null)}
              rows={3}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Categoria"
                value={form.category}
                onChange={(v) => update('category', v)}
                options={categoryOptions}
              />
              <InputField
                label="Ícone (Material Symbols)"
                value={form.category_icon}
                onChange={(v) => update('category_icon', v)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Investimento e Impacto</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Investimento (R$)"
              type="number"
              value={String(form.investment_raw)}
              onChange={(v) => update('investment_raw', Number(v))}
            />
            <InputField
              label="Rótulo do Impacto"
              value={form.impact_label}
              onChange={(v) => update('impact_label', v)}
            />
            <InputField
              label="Número do Impacto"
              type="number"
              value={String(form.impact_number)}
              onChange={(v) => update('impact_number', Number(v))}
            />
            <InputField
              label="Sufixo do Impacto"
              value={form.impact_suffix}
              onChange={(v) => update('impact_suffix', v)}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Datas e Status</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField
              label="Mês"
              value={form.month}
              onChange={(v) => update('month', v)}
            />
            <InputField
              label="Ano"
              value={form.year}
              onChange={(v) => update('year', v)}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => update('status', v as 'concluída' | 'em andamento')}
              options={statusOptions}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Visual</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="URL da Imagem"
              value={form.image ?? ''}
              onChange={(v) => update('image', v || null)}
            />
            <InputField
              label="Cor (hex)"
              value={form.color}
              onChange={(v) => update('color', v)}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Progresso</h3>
          <InputField
            label="Progresso (%)"
            type="number"
            value={String(form.progress)}
            onChange={(v) => update('progress', Math.min(100, Math.max(0, Number(v))))}
          />
        </div>

        {feedback ? (
          <p className={`rounded-xl px-4 py-3 text-sm font-bold ${
            feedback.startsWith('Erro') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'
          }`}>
            {feedback}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
          </button>
          <Link href="/admin/acoes" className="text-sm font-semibold text-on-surface-variant">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
