import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/login/route';
import * as authServer from '@/lib/auth-server';

vi.mock('@/lib/auth-server', () => ({
  callIdentityBackend: vi.fn(),
  IDENTITY_BACKEND_UNAVAILABLE_DETAIL: 'Serviço de autenticação indisponível. Verifique se o backend está ativo.',
  setRefreshCookie: vi.fn(),
  toAuthSession: vi.fn(),
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 503 amigável quando backend de identidade está fora', async () => {
    vi.mocked(authServer.callIdentityBackend).mockResolvedValueOnce(
      Response.json({ detail: authServer.IDENTITY_BACKEND_UNAVAILABLE_DETAIL }, { status: 503 })
    );

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@test.com', password: 'secret' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      detail: authServer.IDENTITY_BACKEND_UNAVAILABLE_DETAIL,
    });
  });
});
