import { apiClient } from '@/services/api';
import type {
  CreateUserRequest,
  ResetUserPasswordResponse,
  UpdateUserRequest,
  UserRecord,
  UsersListResponse,
} from '@/types/user';

const USERS_ENDPOINT = '/api/v1/identity/users';

export const usersService = {
  list: () => apiClient.get<UsersListResponse>(USERS_ENDPOINT),
  getById: (id: number) => apiClient.get<UserRecord>(`${USERS_ENDPOINT}/${id}`),
  create: (payload: CreateUserRequest) => apiClient.post<UserRecord>(USERS_ENDPOINT, payload),
  update: (id: number, payload: UpdateUserRequest) =>
    apiClient.put<UserRecord>(`${USERS_ENDPOINT}/${id}`, payload),
  resetPassword: (id: number) =>
    apiClient.post<ResetUserPasswordResponse>(`${USERS_ENDPOINT}/${id}/reset-password`),
};
