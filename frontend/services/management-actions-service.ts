import { apiClient } from '@/services/api'
import type { ManagementActionListResponse } from '@/types/management-actions'

const ENDPOINT = '/api/v1/management-actions'

export const managementActionsService = {
  getActions: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : ''
    return apiClient.get<ManagementActionListResponse>(`${ENDPOINT}${params}`)
  },
}
