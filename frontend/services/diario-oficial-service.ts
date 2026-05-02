import { apiClient } from '@/services/api';
import type { DiarioResponse, DiarioBuscaResponse, DiarioImportRequest } from '@/types/diario-oficial';
import type { LegislacaoDetalhe } from '@/types/legislacao';

const DIARIO_ENDPOINT = '/api/v1/diario-oficial';

export async function fetchDiarioHoje(): Promise<DiarioResponse> {
  return apiClient.get<DiarioResponse>(`${DIARIO_ENDPOINT}/hoje`);
}

export interface BuscarParams {
  termo?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  size?: number;
}

export async function buscarDiario(params: BuscarParams): Promise<DiarioBuscaResponse> {
  return apiClient.get<DiarioBuscaResponse>(`${DIARIO_ENDPOINT}/buscar`, { params });
}

export async function importarDiario(payload: DiarioImportRequest): Promise<LegislacaoDetalhe> {
  return apiClient.post<LegislacaoDetalhe>(`${DIARIO_ENDPOINT}/importar`, payload);
}
