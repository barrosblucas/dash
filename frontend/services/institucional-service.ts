import { apiClient } from '@/services/api'
import type {
  CityHallRecord,
  DepartmentCreatePayload,
  DepartmentListResponse,
  DepartmentRecord,
  DepartmentUpdatePayload,
  ManagementRecord,
  OfficeCreatePayload,
  OfficeListResponse,
  OfficeRecord,
  OfficeUpdatePayload,
  ProfileUpdatePayload,
} from '@/types/institucional'

const INSTITUCIONAL_ENDPOINT = '/api/v1/institucional'

export const institucionalService = {
  // --- Public methods ---
  getCityHall: () => apiClient.get<CityHallRecord>(`${INSTITUCIONAL_ENDPOINT}/prefeitura`),

  getManagement: () => apiClient.get<ManagementRecord>(`${INSTITUCIONAL_ENDPOINT}/gestao`),

  listDepartments: () =>
    apiClient.get<DepartmentListResponse>(`${INSTITUCIONAL_ENDPOINT}/secretarias`),

  getDepartmentBySlug: (slug: string) =>
    apiClient.get<DepartmentRecord>(`${INSTITUCIONAL_ENDPOINT}/secretarias/${slug}`),

  listOffices: () =>
    apiClient.get<OfficeListResponse>(`${INSTITUCIONAL_ENDPOINT}/reparticoes`),

  // --- Admin methods ---
  adminGetProfile: () =>
    apiClient.get<CityHallRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/profile`),

  adminUpdateProfile: (data: ProfileUpdatePayload) =>
    apiClient.put<CityHallRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/profile`, data),

  adminListDepartments: () =>
    apiClient.get<DepartmentListResponse>(`${INSTITUCIONAL_ENDPOINT}/admin/secretarias`),

  adminCreateDepartment: (data: DepartmentCreatePayload) =>
    apiClient.post<DepartmentRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/secretarias`, data),

  adminUpdateDepartment: (id: number, data: DepartmentUpdatePayload) =>
    apiClient.put<DepartmentRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/secretarias/${id}`, data),

  adminDeleteDepartment: (id: number) =>
    apiClient.delete<void>(`${INSTITUCIONAL_ENDPOINT}/admin/secretarias/${id}`),

  adminListOffices: () =>
    apiClient.get<OfficeListResponse>(`${INSTITUCIONAL_ENDPOINT}/admin/reparticoes`),

  adminCreateOffice: (data: OfficeCreatePayload) =>
    apiClient.post<OfficeRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/reparticoes`, data),

  adminUpdateOffice: (id: number, data: OfficeUpdatePayload) =>
    apiClient.put<OfficeRecord>(`${INSTITUCIONAL_ENDPOINT}/admin/reparticoes/${id}`, data),

  adminDeleteOffice: (id: number) =>
    apiClient.delete<void>(`${INSTITUCIONAL_ENDPOINT}/admin/reparticoes/${id}`),
}
