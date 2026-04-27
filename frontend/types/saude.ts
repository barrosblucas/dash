export interface SaudeMedicationItem {
  product_name: string;
  unit: string | null;
  in_stock: number;
  minimum_stock: number | null;
  department: string | null;
  establishment: string | null;
  below_minimum: boolean;
}

export interface SaudeMedicationStockResponse {
  items: SaudeMedicationItem[];
  total: number;
  page: number;
  page_size: number;
  total_abaixo_minimo: number;
  last_synced_at: string | null;
}

export interface SaudeLabelValueItem {
  label: string;
  value: number;
}

export type SaudeTrendDirection = 'up' | 'down' | 'stable';

export interface SaudeTrendInfo {
  direction: SaudeTrendDirection;
  label?: string | null;
  delta?: number | null;
}

export interface SaudeQuantitativeItem extends SaudeLabelValueItem {
  trend?: SaudeTrendInfo | null;
}

export interface SaudeMonthlySeriesItem {
  label: string;
  value: number;
}

export interface SaudeVacinacaoResponse {
  start_date: string | null;
  end_date: string | null;
  applied_by_month: SaudeMonthlySeriesItem[];
  top_applied: SaudeLabelValueItem[];
  total_applied: number;
  last_synced_at: string | null;
}

export interface SaudePerfilEpidemiologicoResponse {
  quantitativos: SaudeQuantitativeItem[];
  por_sexo: SaudeLabelValueItem[];
  last_synced_at: string | null;
}

export interface SaudePerfilDemograficoResponse {
  tipos_pessoa: SaudeLabelValueItem[];
  pessoas_por_mes: SaudeMonthlySeriesItem[];
  last_synced_at: string | null;
}

export interface SaudeVisitasDomiciliaresResponse {
  start_date: string | null;
  end_date: string | null;
  motives: SaudeLabelValueItem[];
  follow_up: SaudeLabelValueItem[];
  active_search: SaudeLabelValueItem[];
  vector_control: SaudeLabelValueItem[];
  last_synced_at: string | null;
}

export interface SaudeAtencaoPrimariaResponse {
  start_date: string;
  end_date: string;
  attendances_by_month: SaudeMonthlySeriesItem[];
  procedures_by_specialty: SaudeLabelValueItem[];
  attendances_by_category: SaudeLabelValueItem[];
  attendances_by_cbo: SaudeLabelValueItem[];
  last_synced_at: string | null;
}

export interface SaudeSaudeBucalResponse {
  start_date: string | null;
  end_date: string | null;
  attendances_by_month: SaudeMonthlySeriesItem[];
  total_attendances: number;
  last_synced_at: string | null;
}

export interface SaudeProcedimentosTipoResponse {
  items: SaudeLabelValueItem[];
  last_synced_at: string | null;
}

export interface SaudeHospitalCenso {
  total_leitos: number | null;
  ocupados: number | null;
  livres: number | null;
  taxa_ocupacao: number | null;
}

export interface SaudeHospitalHeatmap {
  horas: string[];
  dias: string[];
  matriz: number[][];
  totais_hora: number[];
  totais_dia: number[];
  total_geral: number;
}

export interface SaudeHospitalResponse {
  censo: SaudeHospitalCenso | null;
  heatmap: SaudeHospitalHeatmap | null;
  attendances_by_month: SaudeMonthlySeriesItem[];
  non_resident_attendances: SaudeMonthlySeriesItem[];
  attendances_by_doctor: SaudeLabelValueItem[];
  attendances_by_specialty_cbo: SaudeLabelValueItem[];
  procedures: SaudeLabelValueItem[];
  total_procedures: number;
  internacoes_by_month: SaudeMonthlySeriesItem[];
  internacoes_by_cid: SaudeLabelValueItem[];
  average_stay_by_month: SaudeMonthlySeriesItem[];
  unavailable_resources: string[];
  last_synced_at: string | null;
}

export interface SaudeFarmaciaResponse {
  start_date: string | null;
  end_date: string | null;
  attendances_by_month: SaudeMonthlySeriesItem[];
  dispensed_by_month: SaudeMonthlySeriesItem[];
  top_medicamentos: SaudeLabelValueItem[];
  total_attendances: number;
  total_dispensed: number;
  last_synced_at: string | null;
}

export type SaudeDayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface SaudeUnitRecord {
  id: number;
  name: string;
  unit_type: string;
  address: string;
  neighborhood: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  external_id: number | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SaudeUnitListResponse {
  items: SaudeUnitRecord[];
  total: number;
}

export interface SaudeUnitScheduleItem {
  day_of_week: SaudeDayOfWeek;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

export interface SaudeUnitScheduleResponse {
  unit_id: number;
  schedules: SaudeUnitScheduleItem[];
}

export interface SaudeImportResponse {
  imported: number;
  updated: number;
  total: number;
}

export type SaudeSnapshotResource =
  | 'medicamentos_estoque'
  | 'medicamentos_ranking'
  | 'medicamentos_dispensados_mensal'
  | 'medicamentos_atendimentos_mensal'
  | 'quantitativos'
  | 'atendimentos_por_sexo'
  | 'pessoas_fisicas_juridicas'
  | 'pessoas_por_mes'
  | 'procedimentos_por_tipo'
  | 'vacinas_por_mes'
  | 'vacinas_ranking'
  | 'visitas_motivos'
  | 'visitas_acompanhamento'
  | 'visitas_busca_ativa'
  | 'visitas_controle_vetorial'
  | 'atencao_primaria_atendimentos_mensal'
  | 'atencao_primaria_procedimentos'
  | 'atencao_primaria_cbo'
  | 'saude_bucal_atendimentos_mensal'
  | 'hospital_censo'
  | 'hospital_procedimentos'
  | 'hospital_atendimentos_mensal'
  | 'hospital_atendimentos_cid'
  | 'hospital_mapa_calor'
  | 'hospital_nao_municipes'
  | 'hospital_atendimentos_medico'
  | 'hospital_atendimentos_cbo';

export type SaudeSyncTriggerType = 'manual' | 'scheduled';

export interface SaudeSnapshotStatusItem {
  resource: SaudeSnapshotResource;
  scope_year: number | null;
  synced_at: string;
}

export interface SaudeSyncLogRecord {
  id: number;
  trigger_type: SaudeSyncTriggerType;
  status: string;
  started_at: string;
  finished_at: string | null;
  resources_json: string;
  years_json: string;
  error_message: string | null;
}

export interface SaudeSyncStatusResponse {
  running: boolean;
  next_run_at: string | null;
  last_success_at: string | null;
  snapshots: SaudeSnapshotStatusItem[];
  recent_logs: SaudeSyncLogRecord[];
}

export interface SaudeUnitCreateRequest {
  name: string;
  unit_type: string;
  address: string;
  neighborhood: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  external_id?: number | null;
  source: string;
}

export interface SaudeUnitUpdateRequest {
  name?: string;
  unit_type?: string;
  address?: string;
  neighborhood?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export interface SaudeSyncRequest {
  years?: number[];
  resources?: SaudeSnapshotResource[];
}

export interface SaudeSyncResponse {
  status: string;
  years: number[];
  resources: SaudeSnapshotResource[];
  synced_resources: number;
  failed_resources: number;
  errors: string[];
  started_at: string;
  finished_at: string;
}
