import { apiClient } from '@/services/api';
import type {
  SaudeImportResponse,
  SaudeAtencaoPrimariaResponse,
  SaudeFarmaciaResponse,
  SaudeHospitalResponse,
  SaudeMedicationStockResponse,
  SaudePerfilDemograficoResponse,
  SaudePerfilEpidemiologicoResponse,
  SaudeProcedimentosTipoResponse,
  SaudeSaudeBucalResponse,
  SaudeSyncRequest,
  SaudeSyncResponse,
  SaudeSyncStatusResponse,
  SaudeUnitCreateRequest,
  SaudeUnitListResponse,
  SaudeUnitRecord,
  SaudeUnitScheduleResponse,
  SaudeUnitUpdateRequest,
  SaudeVacinacaoResponse,
  SaudeVisitasDomiciliaresResponse,
} from '@/types/saude';

const SAUDE_ENDPOINT = '/api/v1/saude';
const SAUDE_ADMIN_ENDPOINT = `${SAUDE_ENDPOINT}/admin`;

type SaudeRawTrendDirection = 'up' | 'down' | 'stable';

interface SaudeRawLabelValueItem {
  label: string;
  value: number;
}

interface SaudeRawTrendItem extends SaudeRawLabelValueItem {
  trend: SaudeRawTrendDirection | null;
  previous_value: number | null;
}

interface SaudeRawMonthlySeriesItem {
  label: string;
  value: number;
}

interface SaudeRawVacinacaoResponse {
  start_date: string | null;
  end_date: string | null;
  aplicadas_por_mes: SaudeRawMonthlySeriesItem[];
  ranking_vacinas: SaudeRawLabelValueItem[];
  total_aplicadas: number;
  last_synced_at: string | null;
}

interface SaudeRawVisitasDomiciliaresResponse {
  start_date: string | null;
  end_date: string | null;
  motivos_visita: SaudeRawLabelValueItem[];
  acompanhamento: SaudeRawLabelValueItem[];
  busca_ativa: SaudeRawLabelValueItem[];
  controle_vetorial: SaudeRawLabelValueItem[];
  last_synced_at: string | null;
}

interface SaudeRawPerfilEpidemiologicoResponse {
  quantitativos: SaudeRawTrendItem[];
  por_sexo: SaudeRawLabelValueItem[];
  last_synced_at: string | null;
}

interface SaudeRawAtencaoPrimariaResponse {
  start_date: string;
  end_date: string;
  atendimentos_por_mes: SaudeRawMonthlySeriesItem[];
  procedimentos_por_especialidade: SaudeRawLabelValueItem[];
  atendimentos_por_categoria: SaudeRawLabelValueItem[];
  atendimentos_por_cbo: SaudeRawLabelValueItem[];
  last_synced_at: string | null;
}

interface SaudeRawSaudeBucalResponse {
  start_date: string | null;
  end_date: string | null;
  atendimentos_por_mes: SaudeRawMonthlySeriesItem[];
  total_atendimentos: number;
  last_synced_at: string | null;
}

interface SaudeRawHospitalCenso {
  total_leitos: number | null;
  ocupados: number | null;
  livres: number | null;
  taxa_ocupacao: number | null;
}

interface SaudeRawHospitalResponse {
  censo: SaudeRawHospitalCenso | null;
  mapa_calor: {
    horas: string[];
    dias: string[];
    matriz: number[][];
    totais_hora: number[];
    totais_dia: number[];
    total_geral: number;
  } | null;
  procedimentos_realizados: SaudeRawLabelValueItem[];
  total_procedimentos: number;
  atendimentos_por_mes: SaudeRawMonthlySeriesItem[];
  nao_municipes: SaudeRawMonthlySeriesItem[];
  especialidades_medicas: SaudeRawLabelValueItem[];
  outras_especialidades: SaudeRawLabelValueItem[];
  internacoes_por_mes: SaudeRawMonthlySeriesItem[];
  internacoes_por_cid: SaudeRawLabelValueItem[];
  media_permanencia: SaudeRawMonthlySeriesItem[];
  recursos_indisponiveis: string[];
  last_synced_at: string | null;
}

interface SaudeRawFarmaciaResponse {
  start_date: string | null;
  end_date: string | null;
  atendimentos_por_mes: SaudeRawMonthlySeriesItem[];
  medicamentos_dispensados_por_mes: SaudeRawMonthlySeriesItem[];
  top_medicamentos: SaudeRawLabelValueItem[];
  total_atendimentos: number;
  total_dispensados: number;
  last_synced_at: string | null;
}

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

const mapVaccinationDashboard = (
  response: SaudeRawVacinacaoResponse
): SaudeVacinacaoResponse => ({
  start_date: response.start_date,
  end_date: response.end_date,
  applied_by_month: response.aplicadas_por_mes,
  top_applied: response.ranking_vacinas,
  total_applied: response.total_aplicadas,
  last_synced_at: response.last_synced_at,
});

const mapHomeVisitsDashboard = (
  response: SaudeRawVisitasDomiciliaresResponse
): SaudeVisitasDomiciliaresResponse => ({
  start_date: response.start_date,
  end_date: response.end_date,
  motives: response.motivos_visita,
  follow_up: response.acompanhamento,
  active_search: response.busca_ativa,
  vector_control: response.controle_vetorial,
  last_synced_at: response.last_synced_at,
});

const mapTrend = (item: SaudeRawTrendItem) => ({
  ...item,
  trend: item.trend
    ? {
        direction: item.trend,
        delta: item.previous_value !== null ? item.value - item.previous_value : null,
      }
    : null,
});

const mapEpidemiologicalProfile = (
  response: SaudeRawPerfilEpidemiologicoResponse
): SaudePerfilEpidemiologicoResponse => ({
  quantitativos: response.quantitativos.map(mapTrend),
  por_sexo: response.por_sexo,
  last_synced_at: response.last_synced_at,
});

const mapPrimaryCareDashboard = (
  response: SaudeRawAtencaoPrimariaResponse
): SaudeAtencaoPrimariaResponse => ({
  start_date: response.start_date,
  end_date: response.end_date,
  attendances_by_month: response.atendimentos_por_mes,
  procedures_by_specialty: response.procedimentos_por_especialidade,
  attendances_by_category: response.atendimentos_por_categoria,
  attendances_by_cbo: response.atendimentos_por_cbo,
  last_synced_at: response.last_synced_at,
});

const mapOralHealthDashboard = (
  response: SaudeRawSaudeBucalResponse
): SaudeSaudeBucalResponse => ({
  start_date: response.start_date,
  end_date: response.end_date,
  attendances_by_month: response.atendimentos_por_mes,
  total_attendances: response.total_atendimentos,
  last_synced_at: response.last_synced_at,
});

const mapHospitalDashboard = (
  response: SaudeRawHospitalResponse
): SaudeHospitalResponse => ({
  censo: response.censo,
  heatmap: response.mapa_calor,
  attendances_by_month: response.atendimentos_por_mes,
  non_resident_attendances: response.nao_municipes,
  attendances_by_doctor: response.especialidades_medicas,
  attendances_by_specialty_cbo: response.outras_especialidades,
  procedures: response.procedimentos_realizados,
  total_procedures: response.total_procedimentos,
  internacoes_by_month: response.internacoes_por_mes,
  internacoes_by_cid: response.internacoes_por_cid,
  average_stay_by_month: response.media_permanencia,
  unavailable_resources: response.recursos_indisponiveis,
  last_synced_at: response.last_synced_at,
});

const mapPharmacyDashboard = (
  response: SaudeRawFarmaciaResponse
): SaudeFarmaciaResponse => ({
  start_date: response.start_date,
  end_date: response.end_date,
  attendances_by_month: response.atendimentos_por_mes,
  dispensed_by_month: response.medicamentos_dispensados_por_mes,
  top_medicamentos: response.top_medicamentos,
  total_attendances: response.total_atendimentos,
  total_dispensed: response.total_dispensados,
  last_synced_at: response.last_synced_at,
});

export const saudeService = {
  getMedicationStock: (params?: {
    search?: string;
    estabelecimento?: string;
    page?: number;
    page_size?: number;
  }) => apiClient.get<SaudeMedicationStockResponse>(`${SAUDE_ENDPOINT}/medicamentos-estoque`, { params }),

  getVaccinationDashboard: async (params: { year: number; start_date?: string; end_date?: string }) =>
    mapVaccinationDashboard(
      await apiClient.get<SaudeRawVacinacaoResponse>(`${SAUDE_ENDPOINT}/vacinacao`, {
        params,
      })
    ),

  getHomeVisitsDashboard: async (params?: { start_date?: string; end_date?: string }) =>
    mapHomeVisitsDashboard(
      await apiClient.get<SaudeRawVisitasDomiciliaresResponse>(`${SAUDE_ENDPOINT}/visitas-domiciliares`, {
        params,
      })
    ),

  getEpidemiologicalProfile: async () =>
    mapEpidemiologicalProfile(
      await apiClient.get<SaudeRawPerfilEpidemiologicoResponse>(`${SAUDE_ENDPOINT}/perfil-epidemiologico`)
    ),

  getDemographicProfile: (year: number) =>
    apiClient.get<SaudePerfilDemograficoResponse>(`${SAUDE_ENDPOINT}/perfil-demografico`, {
      params: { year },
    }),

  getProcedureTypes: () =>
    apiClient.get<SaudeProcedimentosTipoResponse>(`${SAUDE_ENDPOINT}/procedimentos-tipo`),

  getPrimaryCareDashboard: async (params: { year: number; start_date?: string; end_date?: string }) =>
    mapPrimaryCareDashboard(
      await apiClient.get<SaudeRawAtencaoPrimariaResponse>(`${SAUDE_ENDPOINT}/atencao-primaria`, {
        params,
      })
    ),

  getOralHealthDashboard: async (params: { year: number; start_date?: string; end_date?: string }) =>
    mapOralHealthDashboard(
      await apiClient.get<SaudeRawSaudeBucalResponse>(`${SAUDE_ENDPOINT}/saude-bucal`, {
        params,
      })
    ),

  getHospitalDashboard: async (params: { year: number; start_date?: string; end_date?: string; estabelecimento_id?: number }) =>
    mapHospitalDashboard(
      await apiClient.get<SaudeRawHospitalResponse>(`${SAUDE_ENDPOINT}/hospital`, {
        params,
      })
    ),

  getPharmacyDashboard: async (params: { year: number; start_date?: string; end_date?: string }) =>
    mapPharmacyDashboard(
      await apiClient.get<SaudeRawFarmaciaResponse>(`${SAUDE_ENDPOINT}/farmacia`, {
        params,
      })
    ),

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
