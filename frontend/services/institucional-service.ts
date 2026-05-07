import { apiClient } from '@/services/api';
import type {
  CityHallRecord,
  ManagementRecord,
  DepartmentListResponse,
  DepartmentRecord,
  OfficeListResponse,
} from '@/types/institucional';

const INSTITUCIONAL_ENDPOINT = '/api/v1/institucional';

export const institucionalService = {
  getCityHall: () => apiClient.get<CityHallRecord>(`${INSTITUCIONAL_ENDPOINT}/prefeitura`),

  getManagement: () => apiClient.get<ManagementRecord>(`${INSTITUCIONAL_ENDPOINT}/gestao`),

  listDepartments: () =>
    apiClient.get<DepartmentListResponse>(`${INSTITUCIONAL_ENDPOINT}/secretarias`),

  getDepartmentBySlug: (slug: string) =>
    apiClient.get<DepartmentRecord>(`${INSTITUCIONAL_ENDPOINT}/secretarias/${slug}`),

  listOffices: () =>
    apiClient.get<OfficeListResponse>(`${INSTITUCIONAL_ENDPOINT}/reparticoes`),
};
