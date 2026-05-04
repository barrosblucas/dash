import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/session/route';
import * as authServer from '@/lib/auth-server';

vi.mock('@/lib/auth-server', () => ({
  callIdentityBackend: vi.fn(),
  clearRefreshCookie: vi.fn(),
  getRefreshCookie: vi.fn(),
  IDENTITY_BACKEND_UNAVAILABLE_DETAIL: 'Serviço de autenticação indisponível. Verifique se o backend está ativo.',
  setRefreshCookie: vi.fn(),
  toAuthSession: vi.fn(),
}));

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 503 sem limpar cookie quando backend de identidade está fora', async () => {
    vi.mocked(authServer.getRefreshCookie).mockReturnValue('refresh-token');
    vi.mocked(authServer.callIdentityBackend).mockResolvedValueOnce(
      Response.json({ detail: authServer.IDENTITY_BACKEND_UNAVAILABLE_DETAIL }, { status: 503 })
    );

    const response = await GET();

    expect(response.status).toBe(503);
    expect(authServer.clearRefreshCookie).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      session: null,
      detail: authServer.IDENTITY_BACKEND_UNAVAILABLE_DETAIL,
    });
  });
});
