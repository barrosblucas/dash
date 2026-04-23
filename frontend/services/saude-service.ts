import { apiClient } from '@/services/api';
import type {
  SaudeImportResponse,
  SaudeMedicamentosDispensadosResponse,
  SaudeMedicationStockResponse,
  SaudePerfilDemograficoResponse,
  SaudePerfilEpidemiologicoResponse,
  SaudeProcedimentosTipoResponse,
  SaudeSyncRequest,
  SaudeSyncResponse,
  SaudeSyncStatusResponse,
  SaudeUnitCreateRequest,
  SaudeUnitListResponse,
  SaudeUnitRecord,
  SaudeUnitScheduleResponse,
  SaudeUnitUpdateRequest,
} from '@/types/saude';

const SAUDE_ENDPOINT = '/api/v1/saude';
const SAUDE_ADMIN_ENDPOINT = `${SAUDE_ENDPOINT}/admin`;

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeUnit = (unit: SaudeUnitRecord): SaudeUnitRecord => ({
  ...unit,
  latitude: toNumber(unit.latitude),
  longitude: toNumber(unit.longitude),
});

const normalizeUnits = (response: SaudeUnitListResponse): SaudeUnitListResponse => ({
  ...response,
  items: response.items.map(normalizeUnit),
});

export const saudeService = {
  getMedicationStock: (params?: {
    search?: string;
    estabelecimento?: string;
    page?: number;
    page_size?: number;
  }) => apiClient.get<SaudeMedicationStockResponse>(`${SAUDE_ENDPOINT}/medicamentos-estoque`, { params }),

  getDispensedMedications: (year: number) =>
    apiClient.get<SaudeMedicamentosDispensadosResponse>(`${SAUDE_ENDPOINT}/medicamentos-dispensados`, {
      params: { year },
    }),

  getEpidemiologicalProfile: () =>
    apiClient.get<SaudePerfilEpidemiologicoResponse>(`${SAUDE_ENDPOINT}/perfil-epidemiologico`),

  getDemographicProfile: (year: number) =>
    apiClient.get<SaudePerfilDemograficoResponse>(`${SAUDE_ENDPOINT}/perfil-demografico`, {
      params: { year },
    }),

  getProcedureTypes: () =>
    apiClient.get<SaudeProcedimentosTipoResponse>(`${SAUDE_ENDPOINT}/procedimentos-tipo`),

  listUnits: async (params?: { tipo?: string; search?: string }) => {
    const response = await apiClient.get<SaudeUnitListResponse>(`${SAUDE_ENDPOINT}/unidades`, { params });
    return normalizeUnits(response);
  },

  getUnitSchedules: (id: number) =>
    apiClient.get<SaudeUnitScheduleResponse>(`${SAUDE_ENDPOINT}/unidades/${id}/horarios`),

  getSyncStatus: () => apiClient.get<SaudeSyncStatusResponse>(`${SAUDE_ENDPOINT}/sync-status`),

  listAdminUnits: async (params?: { tipo?: string; search?: string; ativo?: boolean | 'all' }) => {
    const normalizedParams = {
      ...params,
      ativo: params?.ativo === 'all' ? undefined : params?.ativo,
    };
    const response = await apiClient.get<SaudeUnitListResponse>(`${SAUDE_ADMIN_ENDPOINT}/unidades`, {
      params: normalizedParams,
    });
    return normalizeUnits(response);
  },

  createUnit: async (payload: SaudeUnitCreateRequest) => {
    const response = await apiClient.post<SaudeUnitRecord>(`${SAUDE_ADMIN_ENDPOINT}/unidades`, payload);
    return normalizeUnit(response);
  },

  updateUnit: async (id: number, payload: SaudeUnitUpdateRequest) => {
    const response = await apiClient.put<SaudeUnitRecord>(`${SAUDE_ADMIN_ENDPOINT}/unidades/${id}`, payload);
    return normalizeUnit(response);
  },

  deleteUnit: (id: number) => apiClient.delete<{ message: string }>(`${SAUDE_ADMIN_ENDPOINT}/unidades/${id}`),

  updateUnitSchedules: (id: number, schedules: SaudeUnitScheduleResponse['schedules']) =>
    apiClient.put<SaudeUnitScheduleResponse>(`${SAUDE_ADMIN_ENDPOINT}/unidades/${id}/horarios`, {
      schedules,
    }),

  importUnitsFromESaude: () =>
    apiClient.post<SaudeImportResponse>(`${SAUDE_ADMIN_ENDPOINT}/unidades/importar-esaude`),

  triggerSync: (payload: SaudeSyncRequest) =>
    apiClient.post<SaudeSyncResponse>(`${SAUDE_ADMIN_ENDPOINT}/sync`, payload),
};
