import { apiClient } from '@/services/api';
import type { CargoListResponse } from '@/types/cargo';

const CARGOS_ENDPOINT = '/api/v1/cargos';

export const cargosService = {
  list: async (ano: number, categoria?: string): Promise<CargoListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (categoria) params.categoria = categoria;
    return apiClient.get<CargoListResponse>(`${CARGOS_ENDPOINT}/busca`, { params });
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${CARGOS_ENDPOINT}/anos`);
  },
};
