import { NextResponse } from 'next/server';

import {
  callIdentityBackend,
  clearRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
  toAuthSession,
} from '@/lib/auth-server';
import type { BackendIdentityPayload, RefreshRequest } from '@/types/identity';

export async function GET() {
  const refreshToken = getRefreshCookie();

  if (!refreshToken) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  const backendResponse = await callIdentityBackend(
    '/api/v1/identity/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshRequest),
    }
  );

  if (!backendResponse.ok) {
    clearRefreshCookie();
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  const backendPayload = (await backendResponse.json().catch(() => null)) as BackendIdentityPayload | null;

  if (!backendPayload) {
    clearRefreshCookie();
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  setRefreshCookie(backendPayload.refresh_token, backendPayload.refresh_token_expires_at);

  return NextResponse.json({
    authenticated: true,
    session: toAuthSession(backendPayload),
  });
}
