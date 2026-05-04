import { NextRequest, NextResponse } from 'next/server';

import {
  callIdentityBackend,
  IDENTITY_BACKEND_UNAVAILABLE_DETAIL,
  setRefreshCookie,
  toAuthSession,
} from '@/lib/auth-server';
import type { BackendIdentityPayload, LoginRequest } from '@/types/identity';

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as LoginRequest;
  const backendResponse = await callIdentityBackend('/api/v1/identity/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const backendPayload = (await backendResponse.json().catch(() => null)) as (BackendIdentityPayload & { detail?: string }) | null;

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        detail: backendResponse.status >= 500
          ? (backendPayload?.detail ?? IDENTITY_BACKEND_UNAVAILABLE_DETAIL)
          : 'Credenciais inválidas ou serviço indisponível.',
      },
      { status: backendResponse.status || 401 }
    );
  }

  if (!backendPayload) {
    return NextResponse.json(
      { detail: 'Resposta inválida do serviço de autenticação.' },
      { status: 502 }
    );
  }

  setRefreshCookie(backendPayload.refresh_token, backendPayload.refresh_token_expires_at);

  return NextResponse.json({
    authenticated: true,
    session: toAuthSession(backendPayload),
  });
}
