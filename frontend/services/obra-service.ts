import { apiClient } from '@/services/api';
import type {
  ObraFundingSource,
  ObraLocation,
  ObraMediaAsset,
  ObraMediaLinkPayload,
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
  media_assets: (medicao.media_assets ?? []).map(normalizeMediaAsset),
});

const normalizeLocation = (location: ObraLocation): ObraLocation => ({
  ...location,
  latitude: toNumber(location.latitude),
  longitude: toNumber(location.longitude),
});

const normalizeFundingSource = (source: ObraFundingSource): ObraFundingSource => ({
  ...source,
  valor: toNumber(source.valor),
});

const normalizeMediaAsset = (media: ObraMediaAsset): ObraMediaAsset => ({
  ...media,
  file_size: media.file_size ?? null,
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
  locations: (obra.locations ?? []).map(normalizeLocation),
  funding_sources: (obra.funding_sources ?? []).map(normalizeFundingSource),
  media_assets: (obra.media_assets ?? []).map(normalizeMediaAsset),
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
  create: async (payload: ObraUpsertPayload) => normalizeObra(await apiClient.post<ObraRecord>(OBRAS_ENDPOINT, payload)),
  update: (hash: string, payload: ObraUpsertPayload) =>
    apiClient.put<ObraRecord>(`${OBRAS_ENDPOINT}/${hash}`, payload).then(normalizeObra),
  createMediaLink: async (hash: string, payload: ObraMediaLinkPayload) =>
    normalizeMediaAsset(await apiClient.post<ObraMediaAsset>(`${OBRAS_ENDPOINT}/${hash}/media/link`, payload)),
  uploadMedia: async (
    hash: string,
    payload: { file: File; titulo?: string; media_kind?: string; medicao_id?: number | null }
  ) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.titulo) {
      formData.append('titulo', payload.titulo);
    }
    if (payload.media_kind) {
      formData.append('media_kind', payload.media_kind);
    }
    if (payload.medicao_id) {
      formData.append('medicao_id', String(payload.medicao_id));
    }
    return normalizeMediaAsset(
      await apiClient.post<ObraMediaAsset>(`${OBRAS_ENDPOINT}/${hash}/media/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
  deleteMedia: (hash: string, mediaId: number) =>
    apiClient.delete<{ message: string }>(`${OBRAS_ENDPOINT}/${hash}/media/${mediaId}`),
  remove: (hash: string) => apiClient.delete<void>(`${OBRAS_ENDPOINT}/${hash}`),
};
