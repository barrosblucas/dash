'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { InputField, SelectField, TextareaField } from '@/components/admin/forms/AdminFields';
import { legislacaoAdminService } from '@/services/legislacao-service';
import type { LegislacaoCreatePayload, StatusLegislacao, TipoLegislacao } from '@/types/legislacao';

const tipoOptions: Array<{ value: TipoLegislacao; label: string }> = [
  { value: 'LEI', label: 'Lei' },
  { value: 'LEI_COMPLEMENTAR', label: 'Lei Complementar' },
  { value: 'DECRETO', label: 'Decreto' },
  { value: 'DECRETO_LEI', label: 'Decreto-Lei' },
  { value: 'PORTARIA', label: 'Portaria' },
  { value: 'RESOLUCAO', label: 'Resolução' },
  { value: 'EMENDA', label: 'Emenda' },
];

const statusOptions: Array<{ value: StatusLegislacao; label: string }> = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'REVOGADA', label: 'Revogada' },
  { value: 'ALTERADA', label: 'Alterada' },
];

interface LegislacaoFormProps {
  legislacaoId?: string;
}

function createEmpty(): LegislacaoCreatePayload {
  return {
    tipo: 'LEI',
    numero: '',
    ano: new Date().getFullYear(),
    ementa: '',
    texto_integral: null,
    data_publicacao: '',
    data_promulgacao: null,
    data_vigencia_inicio: null,
    data_vigencia_fim: null,
    status: 'ATIVA',
    autor: null,
    sancionado_por: null,
    origem: null,
    legislacao_vinculada: null,
    url_arquivo: null,
  };
}

export default function LegislacaoForm({ legislacaoId }: LegislacaoFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(legislacaoId);
  const [form, setForm] = useState<LegislacaoCreatePayload>(createEmpty());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [vinculadaInput, setVinculadaInput] = useState('');

  const detailQuery = useQuery({
    queryKey: ['admin', 'legislacoes', legislacaoId],
    queryFn: () => legislacaoAdminService.getById(legislacaoId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm({
      tipo: detailQuery.data.tipo,
      numero: detailQuery.data.numero,
      ano: detailQuery.data.ano,
      ementa: detailQuery.data.ementa,
      texto_integral: detailQuery.data.texto_integral || null,
      data_publicacao: detailQuery.data.data_publicacao,
      data_promulgacao: detailQuery.data.data_promulgacao,
      data_vigencia_inicio: detailQuery.data.data_vigencia_inicio,
      data_vigencia_fim: detailQuery.data.data_vigencia_fim,
      status: detailQuery.data.status,
      autor: detailQuery.data.autor,
      sancionado_por: detailQuery.data.sancionado_por,
      origem: detailQuery.data.origem,
      legislacao_vinculada: detailQuery.data.legislacao_vinculada,
      url_arquivo: detailQuery.data.url_arquivo,
    });
    setVinculadaInput(detailQuery.data.legislacao_vinculada?.join(', ') || '');
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: LegislacaoCreatePayload) => {
      if (isEditing) {
        return legislacaoAdminService.update(legislacaoId!, payload);
      }
      return legislacaoAdminService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'legislacoes'] });
      setFeedback(isEditing ? 'Legislação atualizada com sucesso!' : 'Legislação criada com sucesso!');
      setTimeout(() => {
        router.push('/admin/legislacoes');
      }, 1000);
    },
    onError: (err: Error) => {
      setFeedback(`Erro: ${err.message}`);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: LegislacaoCreatePayload = {
      ...form,
      legislacao_vinculada: vinculadaInput.trim()
        ? vinculadaInput.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
    };

    if (!payload.ementa || payload.ementa.length < 3) {
      setFeedback('Ementa deve ter pelo menos 3 caracteres.');
      return;
    }

    saveMutation.mutate(payload);
  };

  const update = <K extends keyof LegislacaoCreatePayload>(field: K, value: LegislacaoCreatePayload[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isEditing && detailQuery.isLoading) {
    return <p className="text-sm text-on-surface-variant">Carregando dados da legislação...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/legislacoes" className="text-sm font-semibold text-secondary">
          ← Voltar para lista
        </Link>
        <h2 className="mt-2 font-headline text-2xl font-extrabold text-primary">
          {isEditing ? 'Editar legislação' : 'Nova legislação'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Identificação</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField
              label="Tipo"
              value={form.tipo}
              onChange={(v) => update('tipo', v as TipoLegislacao)}
              options={tipoOptions}
            />
            <InputField
              label="Número"
              value={form.numero}
              onChange={(v) => update('numero', v)}
            />
            <InputField
              label="Ano"
              type="number"
              value={String(form.ano)}
              onChange={(v) => update('ano', Number(v))}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Conteúdo</h3>
          <div className="space-y-4">
            <SelectField
              label="Status"
              value={form.status!}
              onChange={(v) => update('status', v as StatusLegislacao)}
              options={statusOptions}
            />
            <TextareaField
              label="Ementa"
              value={form.ementa}
              onChange={(v) => update('ementa', v)}
              rows={3}
            />
            <TextareaField
              label="Texto Integral"
              value={form.texto_integral ?? ''}
              onChange={(v) => update('texto_integral', v || null)}
              rows={6}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Datas</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Data de Publicação"
              type="date"
              value={form.data_publicacao}
              onChange={(v) => update('data_publicacao', v)}
            />
            <InputField
              label="Data de Promulgação"
              type="date"
              value={form.data_promulgacao ?? ''}
              onChange={(v) => update('data_promulgacao', v || null)}
            />
            <InputField
              label="Início da Vigência"
              type="date"
              value={form.data_vigencia_inicio ?? ''}
              onChange={(v) => update('data_vigencia_inicio', v || null)}
            />
            <InputField
              label="Fim da Vigência"
              type="date"
              value={form.data_vigencia_fim ?? ''}
              onChange={(v) => update('data_vigencia_fim', v || null)}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
          <h3 className="mb-4 font-headline text-lg font-bold text-primary">Informações adicionais</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Autor"
              value={form.autor ?? ''}
              onChange={(v) => update('autor', v || null)}
            />
            <InputField
              label="Sancionado por"
              value={form.sancionado_por ?? ''}
              onChange={(v) => update('sancionado_por', v || null)}
            />
            <InputField
              label="Origem"
              value={form.origem ?? ''}
              onChange={(v) => update('origem', v || null)}
            />
            <InputField
              label="URL do Arquivo"
              value={form.url_arquivo ?? ''}
              onChange={(v) => update('url_arquivo', v || null)}
            />
            <div className="sm:col-span-2">
              <InputField
                label="Legislações Vinculadas (IDs separados por vírgula)"
                value={vinculadaInput}
                onChange={setVinculadaInput}
              />
            </div>
          </div>
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
          <Link href="/admin/legislacoes" className="text-sm font-semibold text-on-surface-variant">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
