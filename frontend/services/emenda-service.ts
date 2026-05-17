import { apiClient } from '@/services/api';
import type { EmendaListResponse } from '@/types/emenda';

const EMENDAS_ENDPOINT = '/api/v1/emendas';

export const emendasService = {
  list: async (ano: number, tipo?: string): Promise<EmendaListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (tipo) params.tipo = tipo;
    return apiClient.get<EmendaListResponse>(`${EMENDAS_ENDPOINT}/busca`, { params });
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${EMENDAS_ENDPOINT}/anos`);
  },
};
