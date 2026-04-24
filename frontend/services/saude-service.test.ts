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

  it('consulta vacinação com parâmetro year', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      aplicadas_por_mes: [],
      ranking_vacinas: [],
      total_aplicadas: 0,
      last_synced_at: null,
    });

    await saudeService.getVaccinationDashboard(2026);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/vacinacao', {
      params: { year: 2026 },
    });
  });

  it('consulta atenção primária com ano e data inicial', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      atendimentos_por_mes: [],
      procedimentos_por_especialidade: [],
      atendimentos_por_cbo: [],
      last_synced_at: null,
    });

    await saudeService.getPrimaryCareDashboard({ year: 2025, start_date: '2025-01-01' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/atencao-primaria', {
      params: { year: 2025, start_date: '2025-01-01' },
    });
  });

  it('consulta hospital com filtro opcional de estabelecimento', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      censo: null,
      atendimentos_por_mes: [],
      procedimentos_realizados: [],
      total_procedimentos: 0,
      internacoes_por_mes: [],
      internacoes_por_cid: [],
      media_permanencia: [],
      recursos_indisponiveis: [],
      last_synced_at: null,
    });

    await saudeService.getHospitalDashboard({ estabelecimento_id: 9 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/hospital', {
      params: { estabelecimento_id: 9 },
    });
  });

  it('consulta farmácia com ano selecionado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      atendimentos_por_mes: [],
      medicamentos_dispensados_por_mes: [],
      total_atendimentos: 0,
      total_dispensados: 0,
      last_synced_at: null,
    });

    await saudeService.getPharmacyDashboard(2024);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/saude/farmacia', {
      params: { year: 2024 },
    });
  });
});
