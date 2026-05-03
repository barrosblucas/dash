import { apiClient } from '@/services/api';
import type { LegislacaoBuscaResponse, LegislacaoDownloadRequest, LegislacaoImportRequest } from '@/types/legislacao-municipal';
import type { LegislacaoDetalhe } from '@/types/legislacao';

const ENDPOINT = '/api/v1/legislacao-municipal';

export interface BuscarLegislacaoParams {
  termo?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  size?: number;
}

export async function buscarLegislacao(params: BuscarLegislacaoParams): Promise<LegislacaoBuscaResponse> {
  return apiClient.get<LegislacaoBuscaResponse>(`${ENDPOINT}/buscar`, { params });
}

export async function importarLegislacao(payload: LegislacaoImportRequest): Promise<LegislacaoDetalhe> {
  return apiClient.post<LegislacaoDetalhe>(`${ENDPOINT}/importar`, payload);
}

export async function downloadLegislacao(payload: LegislacaoDownloadRequest): Promise<Blob> {
  return apiClient.post<Blob>(`${ENDPOINT}/download`, payload, {
    responseType: 'blob',
  });
}
