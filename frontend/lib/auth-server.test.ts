import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callIdentityBackend, IDENTITY_BACKEND_UNAVAILABLE_DETAIL } from '@/lib/auth-server';

describe('auth-server', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna 503 json quando o backend de identidade está indisponível', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'));

    const response = await callIdentityBackend('/api/v1/identity/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@test.com', password: 'secret' }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      detail: IDENTITY_BACKEND_UNAVAILABLE_DETAIL,
    });
  });
});
