import { saudeWeekDays } from '@/lib/saude-utils';
import type {
  SaudeDayOfWeek,
  SaudeUnitCreateRequest,
  SaudeUnitRecord,
  SaudeUnitScheduleItem,
  SaudeUnitUpdateRequest,
} from '@/types/saude';

export interface SaudeScheduleDraft {
  day_of_week: SaudeDayOfWeek;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

export interface SaudeUnitFormValues {
  name: string;
  unit_type: string;
  address: string;
  neighborhood: string;
  phone: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  source: string;
}

const normalizeNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const createEmptySchedules = (): SaudeScheduleDraft[] =>
  saudeWeekDays.map((day) => ({
    day_of_week: day,
    opens_at: '',
    closes_at: '',
    is_closed: true,
  }));

export const createEmptyUnitFormValues = (): SaudeUnitFormValues => ({
  name: '',
  unit_type: '',
  address: '',
  neighborhood: '',
  phone: '',
  latitude: '',
  longitude: '',
  is_active: true,
  source: 'manual',
});

export const mapUnitToFormValues = (unit: SaudeUnitRecord): SaudeUnitFormValues => ({
  name: unit.name,
  unit_type: unit.unit_type,
  address: unit.address,
  neighborhood: unit.neighborhood ?? '',
  phone: unit.phone ?? '',
  latitude: unit.latitude?.toString() ?? '',
  longitude: unit.longitude?.toString() ?? '',
  is_active: unit.is_active,
  source: unit.source,
});

export const mapSchedulesToDrafts = (schedules: SaudeUnitScheduleItem[]): SaudeScheduleDraft[] => {
  const draftByDay = new Map(schedules.map((schedule) => [schedule.day_of_week, schedule]));

  return saudeWeekDays.map((day) => {
    const current = draftByDay.get(day);
    return {
      day_of_week: day,
      opens_at: current?.opens_at?.slice(0, 5) ?? '',
      closes_at: current?.closes_at?.slice(0, 5) ?? '',
      is_closed: current?.is_closed ?? true,
    };
  });
};

export const buildCreatePayload = (values: SaudeUnitFormValues): SaudeUnitCreateRequest => ({
  name: values.name.trim(),
  unit_type: values.unit_type.trim(),
  address: values.address.trim(),
  neighborhood: values.neighborhood.trim() || null,
  phone: values.phone.trim() || null,
  latitude: normalizeNumber(values.latitude),
  longitude: normalizeNumber(values.longitude),
  is_active: values.is_active,
  source: values.source.trim() || 'manual',
});

export const buildUpdatePayload = (values: SaudeUnitFormValues): SaudeUnitUpdateRequest => ({
  name: values.name.trim(),
  unit_type: values.unit_type.trim(),
  address: values.address.trim(),
  neighborhood: values.neighborhood.trim() || null,
  phone: values.phone.trim() || null,
  latitude: normalizeNumber(values.latitude),
  longitude: normalizeNumber(values.longitude),
  is_active: values.is_active,
});

export const buildSchedulePayload = (drafts: SaudeScheduleDraft[]): SaudeUnitScheduleItem[] =>
  drafts.map((draft) => ({
    day_of_week: draft.day_of_week,
    opens_at: draft.is_closed ? null : `${draft.opens_at || '07:00'}:00`,
    closes_at: draft.is_closed ? null : `${draft.closes_at || '17:00'}:00`,
    is_closed: draft.is_closed,
  }));
