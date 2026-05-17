import { apiClient } from '@/services/api';
import type { ContratoListResponse, ContratoDetalhe } from '@/types/contrato';

const CONTRATOS_ENDPOINT = '/api/v1/contratos';

export const contratosService = {
  list: async (ano: number, tipo?: string): Promise<ContratoListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (tipo) params.tipo = tipo;
    return apiClient.get<ContratoListResponse>(`${CONTRATOS_ENDPOINT}/busca`, { params });
  },

  detalhe: async (ano: number, numero: string): Promise<ContratoDetalhe> => {
    return apiClient.get<ContratoDetalhe>(
      `${CONTRATOS_ENDPOINT}/${ano}/${encodeURIComponent(numero)}`
    );
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${CONTRATOS_ENDPOINT}/anos`);
  },
};
