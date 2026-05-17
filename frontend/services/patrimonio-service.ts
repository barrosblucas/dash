import { apiClient } from '@/services/api';
import type { PatrimonioListResponse } from '@/types/patrimonio';

const PATRIMONIO_ENDPOINT = '/api/v1/patrimonio';

export const patrimonioService = {
  list: async (ano: number, tipo_bem?: string): Promise<PatrimonioListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (tipo_bem) params.tipo_bem = tipo_bem;
    return apiClient.get<PatrimonioListResponse>(`${PATRIMONIO_ENDPOINT}/busca`, { params });
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${PATRIMONIO_ENDPOINT}/anos`);
  },
};
