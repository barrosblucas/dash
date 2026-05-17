import { apiClient } from '@/services/api';
import type { ConvenioListResponse, ConvenioMovimentacaoResponse } from '@/types/convenio';

const CONVENIOS_ENDPOINT = '/api/v1/convenios';

export const conveniosService = {
  list: async (ano: number, tipo?: string): Promise<ConvenioListResponse> => {
    const params: Record<string, string | number> = { ano };
    if (tipo) params.tipo = tipo;
    return apiClient.get<ConvenioListResponse>(`${CONVENIOS_ENDPOINT}/busca`, { params });
  },

  movimentacoes: async (
    ano: number,
    mes?: number,
    tipo?: string
  ): Promise<ConvenioMovimentacaoResponse> => {
    const params: Record<string, string | number> = { ano };
    if (mes) params.mes = mes;
    if (tipo) params.tipo = tipo;
    return apiClient.get<ConvenioMovimentacaoResponse>(
      `${CONVENIOS_ENDPOINT}/movimentacoes`,
      { params }
    );
  },

  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${CONVENIOS_ENDPOINT}/anos`);
  },
};
