import type {
  ObraFundingSource,
  ObraLocation,
  ObraMediaAsset,
  ObraMedicao,
  ObraRecord,
  ObraUpsertPayload,
} from '@/types/obra';

export interface PendingUpload {
  key: string;
  file: File;
  titulo: string;
  media_kind: string;
}

export const statusOptions = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'paralisada', label: 'Paralisada' },
  { value: 'concluida', label: 'Concluída' },
] as const;

export const financialFields = [
  ['valor_orcamento', 'Valor orçamento'],
  ['valor_original', 'Valor original'],
  ['valor_aditivo', 'Valor aditivo'],
  ['valor_homologado', 'Valor homologado'],
  ['valor_contrapartida', 'Valor contrapartida'],
  ['valor_convenio', 'Valor convênio'],
] as const;

export const createLocation = (sequencia: number): ObraLocation => ({
  sequencia,
  logradouro: '',
  bairro: '',
  cep: '',
  numero: '',
  latitude: null,
  longitude: null,
});

export const createFundingSource = (sequencia: number): ObraFundingSource => ({
  sequencia,
  nome: '',
  valor: null,
});

export const createMeasurement = (sequencia: number): ObraMedicao => ({
  sequencia,
  mes_referencia: 1,
  ano_referencia: new Date().getFullYear(),
  valor_medicao: 0,
  observacao: '',
  media_assets: [],
});

export const createEmptyObra = (): ObraUpsertPayload => ({
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
  locations: [createLocation(1)],
  funding_sources: [createFundingSource(1)],
  media_assets: [],
  medicoes: [],
});

export const parseLocaleNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes(',') && trimmed.includes('.')
    ? trimmed.replaceAll('.', '').replace(',', '.')
    : trimmed.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toInputValue = (value: number | null | undefined) => (
  value === null || value === undefined ? '' : String(value)
);

export const toUrlMedia = (mediaAssets: ObraMediaAsset[]) => (
  mediaAssets.filter((item) => item.source_type === 'url' && item.url)
);

export const withDefaultArrays = (record: ObraRecord): ObraUpsertPayload => ({
  titulo: record.titulo,
  descricao: record.descricao,
  status: record.status,
  secretaria: record.secretaria,
  orgao: record.orgao,
  contrato: record.contrato,
  tipo_obra: record.tipo_obra,
  modalidade: record.modalidade,
  fonte_recurso: record.fonte_recurso,
  data_inicio: record.data_inicio ?? '',
  previsao_termino: record.previsao_termino,
  data_termino: record.data_termino,
  logradouro: record.logradouro,
  bairro: record.bairro,
  cep: record.cep,
  numero: record.numero,
  latitude: record.latitude,
  longitude: record.longitude,
  valor_orcamento: record.valor_orcamento,
  valor_original: record.valor_original,
  valor_aditivo: record.valor_aditivo,
  valor_homologado: record.valor_homologado,
  valor_contrapartida: record.valor_contrapartida,
  valor_convenio: record.valor_convenio,
  progresso_fisico: record.progresso_fisico,
  progresso_financeiro: record.progresso_financeiro,
  locations: record.locations.length ? record.locations : [createLocation(1)],
  funding_sources: record.funding_sources.length ? record.funding_sources : [createFundingSource(1)],
  media_assets: record.media_assets,
  medicoes: record.medicoes.map((medicao) => ({
    ...medicao,
    observacao: medicao.observacao ?? '',
    media_assets: medicao.media_assets ?? [],
  })),
});

export const buildPayload = (form: ObraUpsertPayload): ObraUpsertPayload => {
  const primaryLocation = form.locations[0] ?? createLocation(1);
  const primarySource = form.funding_sources[0] ?? createFundingSource(1);

  return {
    ...form,
    fonte_recurso: primarySource.nome.trim(),
    logradouro: primaryLocation.logradouro.trim(),
    bairro: primaryLocation.bairro.trim(),
    cep: primaryLocation.cep.trim(),
    numero: primaryLocation.numero.trim(),
    latitude: primaryLocation.latitude,
    longitude: primaryLocation.longitude,
    media_assets: toUrlMedia(form.media_assets),
    medicoes: form.medicoes.map((medicao) => ({
      ...medicao,
      observacao: medicao.observacao?.trim() || null,
      media_assets: toUrlMedia(medicao.media_assets),
    })),
  };
};

export const validatePayload = (payload: ObraUpsertPayload) => {
  const messages: string[] = [];
  if (payload.titulo.trim().length < 3) messages.push('O título deve ter no mínimo 3 caracteres.');
  if (payload.descricao.trim().length < 3) messages.push('A descrição deve ter no mínimo 3 caracteres.');
  if (!payload.secretaria.trim()) messages.push('Informe a secretaria.');
  if (!payload.orgao.trim()) messages.push('Informe o órgão.');
  if (!payload.contrato.trim()) messages.push('Informe o contrato.');
  if (!payload.tipo_obra.trim()) messages.push('Informe o tipo da obra.');
  if (!payload.modalidade.trim()) messages.push('Informe a modalidade.');
  if (!payload.data_inicio) messages.push('Informe a data de início.');
  if (!payload.logradouro.trim()) messages.push('Informe o logradouro.');
  if (!payload.bairro.trim()) messages.push('Informe o bairro.');
  if (!payload.cep.trim()) messages.push('Informe o CEP.');
  if (!payload.numero.trim()) messages.push('Informe o número.');
  if (payload.fonte_recurso === '') messages.push('Informe ao menos uma fonte de recurso.');

  payload.locations.forEach((loc, i) => {
    if (!loc.logradouro.trim()) messages.push(`Local ${i + 1}: informe o logradouro.`);
    if (!loc.bairro.trim()) messages.push(`Local ${i + 1}: informe o bairro.`);
    if (!loc.cep.trim()) messages.push(`Local ${i + 1}: informe o CEP.`);
    if (!loc.numero.trim()) messages.push(`Local ${i + 1}: informe o número.`);
  });

  payload.funding_sources.forEach((src, i) => {
    if (!src.nome.trim()) messages.push(`Fonte ${i + 1}: informe o nome.`);
  });

  return messages[0] ?? null;
};
