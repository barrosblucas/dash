import { apiClient } from '@/services/api';
import type { DiarioResponse } from '@/types/diario-oficial';

const DIARIO_ENDPOINT = '/api/v1/diario-oficial';

export async function fetchDiarioHoje(): Promise<DiarioResponse> {
  return apiClient.get<DiarioResponse>(`${DIARIO_ENDPOINT}/hoje`);
}
