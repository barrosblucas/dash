import { apiClient } from '@/services/api'
import type {
  ManagementAction,
  ManagementActionCreatePayload,
  ManagementActionListResponse,
  ManagementActionUpdatePayload,
} from '@/types/management-actions'

const ENDPOINT = '/api/v1/management-actions'

export const managementActionsService = {
  getActions: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : ''
    return apiClient.get<ManagementActionListResponse>(`${ENDPOINT}${params}`)
  },
  create: (payload: ManagementActionCreatePayload) =>
    apiClient.post<ManagementAction>(ENDPOINT, payload),
  update: (id: number, payload: ManagementActionUpdatePayload) =>
    apiClient.put<ManagementAction>(`${ENDPOINT}/${id}`, payload),
  remove: (id: number) =>
    apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
