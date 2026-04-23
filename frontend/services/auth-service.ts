import { apiClient } from '@/services/api';
import type {
  AuthSessionResponse,
  LoginRequest,
  PasswordResetConsumeRequest,
  PasswordResetConsumeResponse,
} from '@/types/identity';

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || payload === null) {
    const message =
      typeof payload === 'object' && payload && 'detail' in payload
        ? String(payload.detail)
        : 'Não foi possível concluir a autenticação.';

    throw new Error(message);
  }

  return payload;
};

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthSessionResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseJson<AuthSessionResponse>(response);
  },

  session: async (): Promise<AuthSessionResponse> => {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    return parseJson<AuthSessionResponse>(response);
  },

  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Não foi possível encerrar a sessão.');
    }
  },

  consumePasswordReset: async (
    payload: PasswordResetConsumeRequest
  ): Promise<PasswordResetConsumeResponse> => {
    return apiClient.post<PasswordResetConsumeResponse>(
      '/api/v1/identity/password-resets/consume',
      payload
    );
  },
};
