export type UserRole = 'admin' | 'user';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  token_version: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UsersListResponse {
  users: UserRecord[];
  total: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ResetUserPasswordResponse {
  reset_token: string;
  reset_url: string;
  expires_at: string;
}
