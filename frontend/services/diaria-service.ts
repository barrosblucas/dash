import { apiClient } from '@/services/api';
import type { DiariaListResponse } from '@/types/diaria';

const DIARIAS_ENDPOINT = '/api/v1/diarias';

export const diariasService = {
  list: async (ano: number, mes?: number): Promise<DiariaListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (mes !== undefined) params.mes = mes;
    return apiClient.get<DiariaListResponse>(`${DIARIAS_ENDPOINT}/busca`, { params });
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${DIARIAS_ENDPOINT}/anos`);
  },
};
