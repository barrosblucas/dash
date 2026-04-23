import { cookies } from 'next/headers';

import type { BackendIdentityPayload } from '@/types/identity';

export const AUTH_REFRESH_COOKIE_NAME = 'dashboard_refresh_token';
const secureCookie = process.env.NODE_ENV === 'production';

const getBackendBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getCookieMaxAge = (expiresAt: string) => {
  const expiresAtMs = new Date(expiresAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
};

export const setRefreshCookie = (refreshToken: string, refreshTokenExpiresAt: string) => {
  cookies().set(AUTH_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
    maxAge: getCookieMaxAge(refreshTokenExpiresAt),
  });
};

export const clearRefreshCookie = () => {
  cookies().set(AUTH_REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
    maxAge: 0,
  });
};

export const getRefreshCookie = () => cookies().get(AUTH_REFRESH_COOKIE_NAME)?.value ?? null;

export const toAuthSession = (payload: BackendIdentityPayload) => ({
  access_token: payload.access_token,
  access_token_expires_at: payload.access_token_expires_at,
  refresh_token_expires_at: payload.refresh_token_expires_at,
  token_type: payload.token_type,
  user: payload.user,
});

export const callIdentityBackend = async (
  path: string,
  init: RequestInit = {}
) => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  return fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
};
