/**
 * Tipos da feature Institucional / Prefeitura
 * Espelham os schemas Pydantic do backend
 */

export interface CityHallContact {
  address: string | null;
  phone: string | null;
  email: string | null;
  office_hours: string | null;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface CityHallRecord {
  city_hall_name: string;
  description: string | null;
  image_url: string | null;
  contact: CityHallContact;
  social_links: SocialLink[];
  updated_at: string;
}

export interface OfficialRecord {
  role: string;
  name: string | null;
  photo_url: string | null;
  bio: string | null;
}

export interface ManagementRecord {
  mayor: OfficialRecord;
  vice_mayor: OfficialRecord;
  cabinet_chief: OfficialRecord;
  cabinet_description: string | null;
  updated_at: string;
}

export type DepartmentKind = 'secretaria' | 'autarquia';

export interface DepartmentRecord {
  id: number;
  slug: string;
  name: string;
  kind: DepartmentKind;
  leader_title: string;
  secretary_name: string | null;
  secretary_photo_url: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  values: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  image_url: string | null;
  updated_at: string;
}

export interface DepartmentListResponse {
  items: DepartmentRecord[];
  total: number;
}

export type OfficeKind = 'secretaria' | 'setor' | 'reparticao' | 'gabinete' | 'autarquia';

export interface OfficeRecord {
  id: number;
  department_id: number | null;
  department_name: string | null;
  department_slug: string | null;
  kind: OfficeKind;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

export interface OfficeListResponse {
  items: OfficeRecord[];
  total: number;
}

// --- Admin payload types ---

export interface ProfileUpdatePayload {
  city_hall_name?: string;
  description?: string;
  image_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  office_hours?: string;
  social_links?: SocialLink[];
  mayor_name?: string;
  mayor_photo_url?: string;
  mayor_bio?: string;
  vice_mayor_name?: string;
  vice_mayor_photo_url?: string;
  vice_mayor_bio?: string;
  cabinet_chief_name?: string;
  cabinet_chief_photo_url?: string;
  cabinet_chief_bio?: string;
  cabinet_description?: string;
}

export interface DepartmentCreatePayload {
  slug: string;
  name: string;
  kind?: DepartmentKind;
  leader_title?: string;
  secretary_name?: string;
  secretary_photo_url?: string;
  description?: string;
  mission?: string;
  vision?: string;
  values?: string;
  phone?: string;
  email?: string;
  address?: string;
  office_hours?: string;
  image_url?: string;
}

export interface DepartmentUpdatePayload {
  slug?: string;
  name?: string;
  kind?: DepartmentKind;
  leader_title?: string;
  secretary_name?: string;
  secretary_photo_url?: string;
  description?: string;
  mission?: string;
  vision?: string;
  values?: string;
  phone?: string;
  email?: string;
  address?: string;
  office_hours?: string;
  image_url?: string;
}

export interface OfficeCreatePayload {
  department_id?: number;
  kind?: OfficeKind;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  office_hours?: string;
  latitude?: number;
  longitude?: number;
}

export interface OfficeUpdatePayload {
  department_id?: number;
  kind?: OfficeKind;
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  office_hours?: string;
  latitude?: number;
  longitude?: number;
}

// Combined response for admin profile (city hall + management)
export interface AdminPrefeituraProfile {
  city_hall: CityHallRecord;
  gestao: ManagementRecord;
}
