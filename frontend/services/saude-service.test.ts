import { describe, expect, it, vi, beforeEach } from 'vitest';

import { saudeService } from '@/services/saude-service';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('saude-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normaliza latitude e longitude na listagem pública de unidades', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [
        {
          id: 1,
          name: 'UBS Central',
          unit_type: 'UBS',
          address: 'Rua A',
          neighborhood: 'Centro',
          phone: '6733330000',
          latitude: '-19.918',
          longitude: '-54.358',
          is_active: true,
          external_id: null,
          source: 'manual',
          created_at: '2026-04-23T10:00:00',
          updated_at: '2026-04-23T10:00:00',
        },
      ],
      total: 1,
    });

    const response = await saudeService.listUnits({ tipo: 'UBS' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/unidades', {
      params: { tipo: 'UBS' },
    });
    expect(response.items[0].latitude).toBe(-19.918);
    expect(response.items[0].longitude).toBe(-54.358);
  });

  it('remove filtro ativo quando valor all é usado no admin', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });

    await saudeService.listAdminUnits({ ativo: 'all', search: 'ubs' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/admin/unidades', {
      params: { ativo: undefined, search: 'ubs' },
    });
  });
});
