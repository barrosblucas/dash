'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { InputField, SelectField, TextareaField } from '@/components/admin/forms/AdminFields';
import { formatCurrency } from '@/lib/obra-formatters';
import { obrasService } from '@/services/obra-service';
import type { ObraMedicao, ObraRecord, ObraStatus, ObraUpsertPayload } from '@/types/obra';

interface ObraFormProps {
  obraHash?: string;
}

const statusOptions = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'paralisada', label: 'Paralisada' },
  { value: 'concluida', label: 'Concluída' },
] as const;

const createEmptyObra = (): ObraUpsertPayload => ({
  titulo: '',
  descricao: '',
  status: 'em_andamento',
  secretaria: '',
  orgao: '',
  contrato: '',
  tipo_obra: '',
  modalidade: '',
  fonte_recurso: '',
  data_inicio: '',
  previsao_termino: null,
  data_termino: null,
  logradouro: '',
  bairro: '',
  cep: '',
  numero: '',
  latitude: null,
  longitude: null,
  valor_orcamento: null,
  valor_original: null,
  valor_aditivo: null,
  valor_homologado: null,
  valor_contrapartida: null,
  valor_convenio: null,
  progresso_fisico: null,
  progresso_financeiro: null,
  medicoes: [],
});

const toNumberOrNull = (value: string) => (value === '' ? null : Number(value));

const toInputValue = (value: number | null) => (value === null ? '' : String(value));

export default function ObraForm({ obraHash }: ObraFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(obraHash);
  const [form, setForm] = useState<ObraUpsertPayload>(createEmptyObra());
  const [feedback, setFeedback] = useState<string | null>(null);

  const obraQuery = useQuery({
    queryKey: ['admin', 'obras', obraHash],
    queryFn: () => obrasService.getByHash(obraHash!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!obraQuery.data) {
      return;
    }

    const record: ObraRecord = obraQuery.data;
    const {
      hash: _hash,
      valor_economizado: _valorEconomizado,
      valor_medido_total: _valorMedidoTotal,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...payload
    } = record;
    void _hash;
    void _valorEconomizado;
    void _valorMedidoTotal;
    void _createdAt;
    void _updatedAt;
    setForm({
      ...payload,
      data_inicio: payload.data_inicio ?? '',
    });
  }, [obraQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && obraHash) {
        return obrasService.update(obraHash, form);
      }

      return obrasService.create(form);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'obras'] });
      router.push('/admin/obras');
    },
  });

  const totalMedido = useMemo(
    () => form.medicoes.reduce((total, medicao) => total + medicao.valor_medicao, 0),
    [form.medicoes]
  );

  const updateField = <K extends keyof ObraUpsertPayload>(field: K, value: ObraUpsertPayload[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateMeasurement = (index: number, nextMeasurement: ObraMedicao) => {
    setForm((current) => ({
      ...current,
      medicoes: current.medicoes.map((medicao, currentIndex) =>
        currentIndex === index ? nextMeasurement : medicao
      ),
    }));
  };

  const addMeasurement = () => {
    setForm((current) => ({
        ...current,
        medicoes: [
          ...current.medicoes,
          {
            sequencia: current.medicoes.length + 1,
            mes_referencia: 1,
            ano_referencia: new Date().getFullYear(),
            valor_medicao: 0,
            observacao: '',
          },
        ],
      }));
  };

  const removeMeasurement = (index: number) => {
    setForm((current) => ({
      ...current,
      medicoes: current.medicoes
        .filter((_, currentIndex) => currentIndex !== index)
        .map((medicao, currentIndex) => ({ ...medicao, sequencia: currentIndex + 1 })),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    await saveMutation.mutateAsync().catch((error: Error) => setFeedback(error.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary">{isEditing ? 'Editar obra' : 'Nova obra'}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Cadastro completo alinhado ao contrato de obras públicas.</p>
        </div>
        <Link href="/admin/obras" className="text-sm font-semibold text-secondary">Voltar</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl bg-surface-container-low p-7 shadow-ambient">
        {/* Seção: Informações básicas */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container material-symbols-outlined text-[18px]">info</span>
            <h3 className="font-headline text-lg font-bold text-primary">Informações básicas</h3>
          </div>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-3">
            <InputField label="Título" value={form.titulo} onChange={(value) => updateField('titulo', value)} />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => updateField('status', value as ObraStatus)}
              options={statusOptions.map((option) => ({ ...option }))}
            />
            <InputField label="Secretaria" value={form.secretaria} onChange={(value) => updateField('secretaria', value)} />
            <InputField label="Órgão" value={form.orgao} onChange={(value) => updateField('orgao', value)} />
            <InputField label="Contrato" value={form.contrato} onChange={(value) => updateField('contrato', value)} />
            <InputField label="Tipo da obra" value={form.tipo_obra} onChange={(value) => updateField('tipo_obra', value)} />
            <InputField label="Modalidade" value={form.modalidade} onChange={(value) => updateField('modalidade', value)} />
            <InputField label="Fonte do recurso" value={form.fonte_recurso} onChange={(value) => updateField('fonte_recurso', value)} />
            <InputField label="Data de início" type="date" value={form.data_inicio} onChange={(value) => updateField('data_inicio', value)} />
            <InputField label="Previsão de término" type="date" value={form.previsao_termino ?? ''} onChange={(value) => updateField('previsao_termino', value || null)} />
            <InputField label="Data de término" type="date" value={form.data_termino ?? ''} onChange={(value) => updateField('data_termino', value || null)} />
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-5">
            <TextareaField label="Descrição" value={form.descricao} onChange={(value) => updateField('descricao', value)} rows={5} />
          </div>
        </section>

        {/* Seção: Localização e progresso */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container material-symbols-outlined text-[18px]">location_on</span>
            <h3 className="font-headline text-lg font-bold text-primary">Localização e progresso</h3>
          </div>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-4">
            <InputField label="Logradouro" value={form.logradouro} onChange={(value) => updateField('logradouro', value)} />
            <InputField label="Bairro" value={form.bairro} onChange={(value) => updateField('bairro', value)} />
            <InputField label="CEP" value={form.cep} onChange={(value) => updateField('cep', value)} />
            <InputField label="Número" value={form.numero} onChange={(value) => updateField('numero', value)} />
            <InputField label="Latitude" type="number" step={0.000001} value={toInputValue(form.latitude)} onChange={(value) => updateField('latitude', toNumberOrNull(value))} />
            <InputField label="Longitude" type="number" step={0.000001} value={toInputValue(form.longitude)} onChange={(value) => updateField('longitude', toNumberOrNull(value))} />
            <InputField label="Progresso físico (%)" type="number" min={0} max={100} value={toInputValue(form.progresso_fisico)} onChange={(value) => updateField('progresso_fisico', toNumberOrNull(value))} />
            <InputField label="Progresso financeiro (%)" type="number" min={0} max={100} value={toInputValue(form.progresso_financeiro)} onChange={(value) => updateField('progresso_financeiro', toNumberOrNull(value))} />
          </div>
        </section>

        {/* Seção: Valores financeiros */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary-container text-on-tertiary-container material-symbols-outlined text-[18px]">payments</span>
            <h3 className="font-headline text-lg font-bold text-primary">Valores financeiros</h3>
          </div>
          <div className="grid gap-4 rounded-2xl bg-surface-container-lowest p-5 md:grid-cols-2 xl:grid-cols-3">
            <InputField label="Valor orçamento" type="number" step={0.01} value={toInputValue(form.valor_orcamento)} onChange={(value) => updateField('valor_orcamento', toNumberOrNull(value))} />
            <InputField label="Valor original" type="number" step={0.01} value={toInputValue(form.valor_original)} onChange={(value) => updateField('valor_original', toNumberOrNull(value))} />
            <InputField label="Valor aditivo" type="number" step={0.01} value={toInputValue(form.valor_aditivo)} onChange={(value) => updateField('valor_aditivo', toNumberOrNull(value))} />
            <InputField label="Valor homologado" type="number" step={0.01} value={toInputValue(form.valor_homologado)} onChange={(value) => updateField('valor_homologado', toNumberOrNull(value))} />
            <InputField label="Valor contrapartida" type="number" step={0.01} value={toInputValue(form.valor_contrapartida)} onChange={(value) => updateField('valor_contrapartida', toNumberOrNull(value))} />
            <InputField label="Valor convênio" type="number" step={0.01} value={toInputValue(form.valor_convenio)} onChange={(value) => updateField('valor_convenio', toNumberOrNull(value))} />
            <div className="md:col-span-2 xl:col-span-3">
              <InputField label="Valor economizado (somente leitura)" value={formatCurrency(obraQuery.data?.valor_economizado ?? null)} onChange={() => undefined} readOnly />
            </div>
          </div>
        </section>

        {/* Seção: Medições mensais */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container material-symbols-outlined text-[18px]">calendar_month</span>
            <h3 className="font-headline text-lg font-bold text-primary">Medições mensais</h3>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant">Valor medido total: <span className="font-semibold text-on-surface">{formatCurrency(totalMedido)}</span></p>
              <button type="button" onClick={addMeasurement} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar medição
              </button>
            </div>

            <div className="space-y-4">
              {form.medicoes.map((medicao, index) => (
                <div key={`${medicao.sequencia}-${index}`} className="grid gap-4 rounded-2xl border border-outline/20 bg-surface p-4 md:grid-cols-5">
                  <InputField label="Sequência" type="number" min={1} value={medicao.sequencia} onChange={(value) => updateMeasurement(index, { ...medicao, sequencia: Number(value) })} />
                  <InputField label="Mês" type="number" min={1} max={12} value={medicao.mes_referencia} onChange={(value) => updateMeasurement(index, { ...medicao, mes_referencia: Number(value) })} />
                  <InputField label="Ano" type="number" min={2000} value={medicao.ano_referencia} onChange={(value) => updateMeasurement(index, { ...medicao, ano_referencia: Number(value) })} />
                  <InputField label="Valor" type="number" step={0.01} value={medicao.valor_medicao} onChange={(value) => updateMeasurement(index, { ...medicao, valor_medicao: Number(value) })} />
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeMeasurement(index)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary-container px-4 py-3 text-sm font-bold text-on-tertiary-container transition hover:bg-tertiary-container/80">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Remover
                    </button>
                  </div>
                  <div className="md:col-span-5">
                    <TextareaField label="Observação" value={medicao.observacao ?? ''} onChange={(value) => updateMeasurement(index, { ...medicao, observacao: value })} rows={3} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {feedback ? <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error">{feedback}</div> : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/obras" className="rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest">
            Cancelar
          </Link>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:opacity-90">
            <span className="material-symbols-outlined text-[18px]">{saveMutation.isPending ? 'sync' : 'save'}</span>
            {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Salvar obra' : 'Criar obra'}
          </button>
        </div>
      </form>
    </div>
  );
}
