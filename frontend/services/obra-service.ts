import { apiClient } from '@/services/api';
import type {
  ObraMedicao,
  ObraRecord,
  ObrasListResponse,
  ObraUpsertPayload,
} from '@/types/obra';

const OBRAS_ENDPOINT = '/api/v1/obras';

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeMedicao = (medicao: ObraMedicao): ObraMedicao => ({
  ...medicao,
  valor_medicao: toNumber(medicao.valor_medicao) ?? 0,
});

const normalizeObra = (obra: ObraRecord): ObraRecord => ({
  ...obra,
  latitude: toNumber(obra.latitude),
  longitude: toNumber(obra.longitude),
  valor_orcamento: toNumber(obra.valor_orcamento),
  valor_original: toNumber(obra.valor_original),
  valor_aditivo: toNumber(obra.valor_aditivo),
  valor_homologado: toNumber(obra.valor_homologado),
  valor_contrapartida: toNumber(obra.valor_contrapartida),
  valor_convenio: toNumber(obra.valor_convenio),
  valor_economizado: toNumber(obra.valor_economizado),
  progresso_fisico: toNumber(obra.progresso_fisico),
  progresso_financeiro: toNumber(obra.progresso_financeiro),
  valor_medido_total: toNumber(obra.valor_medido_total) ?? 0,
  medicoes: obra.medicoes.map(normalizeMedicao),
});

export const obrasService = {
  list: async (status?: string) => {
    const response = await apiClient.get<ObrasListResponse>(OBRAS_ENDPOINT, {
      params: status ? { status } : undefined,
    });

    return {
      ...response,
      obras: response.obras.map(normalizeObra),
    } satisfies ObrasListResponse;
  },
  getByHash: async (hash: string) => {
    const response = await apiClient.get<ObraRecord>(`${OBRAS_ENDPOINT}/${hash}`);
    return normalizeObra(response);
  },
  create: (payload: ObraUpsertPayload) => apiClient.post<ObraRecord>(OBRAS_ENDPOINT, payload),
  update: (hash: string, payload: ObraUpsertPayload) =>
    apiClient.put<ObraRecord>(`${OBRAS_ENDPOINT}/${hash}`, payload),
  remove: (hash: string) => apiClient.delete<void>(`${OBRAS_ENDPOINT}/${hash}`),
};
