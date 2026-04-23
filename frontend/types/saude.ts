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

export interface SaudeMonthlySeriesItem {
  label: string;
  value: number;
}

export interface SaudeMedicamentosDispensadosResponse {
  ranking: SaudeLabelValueItem[];
  series_mensal_dispensacao: SaudeMonthlySeriesItem[];
  series_mensal_atendimentos: SaudeMonthlySeriesItem[];
  last_synced_at: string | null;
}

export interface SaudePerfilEpidemiologicoResponse {
  quantitativos: SaudeLabelValueItem[];
  por_sexo: SaudeLabelValueItem[];
  last_synced_at: string | null;
}

export interface SaudePerfilDemograficoResponse {
  tipos_pessoa: SaudeLabelValueItem[];
  pessoas_por_mes: SaudeMonthlySeriesItem[];
  last_synced_at: string | null;
}

export interface SaudeProcedimentosTipoResponse {
  items: SaudeLabelValueItem[];
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
  | 'pessoas_fisicas_juridicas'
  | 'pessoas_por_mes'
  | 'procedimentos_por_tipo';

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
