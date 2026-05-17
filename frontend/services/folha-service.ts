import { apiClient } from '@/services/api';
import type { FolhaOfficeListResponse, FolhaEmployeeListResponse } from '@/types/folha';

const FOLHA_ENDPOINT = '/api/v1/folha';

export const folhaService = {
  anos: async (): Promise<number[]> => {
    return apiClient.get<number[]>(`${FOLHA_ENDPOINT}/anos`);
  },

  offices: async (ano: number, mes: number): Promise<FolhaOfficeListResponse> => {
    return apiClient.get<FolhaOfficeListResponse>(`${FOLHA_ENDPOINT}/offices`, {
      params: { ano, mes },
    });
  },

  employees: async (
    ano: number,
    mes: number,
    office_id?: number,
    department_id?: number,
    keyword?: string,
  ): Promise<FolhaEmployeeListResponse> => {
    const params: Record<string, string | number> = { ano, mes };
    if (office_id !== undefined && office_id !== 0) params.office_id = office_id;
    if (department_id !== undefined && department_id !== 0) params.department_id = department_id;
    if (keyword?.trim()) params.keyword = keyword.trim();
    return apiClient.get<FolhaEmployeeListResponse>(`${FOLHA_ENDPOINT}/employees`, { params });
  },
};
