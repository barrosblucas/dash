import { NextResponse } from 'next/server';

import { callIdentityBackend, clearRefreshCookie, getRefreshCookie } from '@/lib/auth-server';
import type { LogoutRequest } from '@/types/identity';

export async function POST() {
  const refreshToken = getRefreshCookie();

  if (refreshToken) {
    await callIdentityBackend('/api/v1/identity/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken } satisfies LogoutRequest),
    });
  }

  clearRefreshCookie();

  return NextResponse.json({ success: true });
}
