import type { UserRecord } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token?: string | null;
}

export interface AuthSessionPayload {
  access_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  token_type: 'bearer';
  user: UserRecord;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  session: AuthSessionPayload | null;
}

export interface BackendIdentityPayload extends AuthSessionPayload {
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface PasswordResetConsumeRequest {
  reset_token: string;
  new_password: string;
}

export interface PasswordResetConsumeResponse {
  message: string;
}
