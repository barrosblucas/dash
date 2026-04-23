import { PERIODO_DADOS } from '@/lib/constants';
import type { SaudeDayOfWeek, SaudeSyncLogRecord, SaudeUnitScheduleItem } from '@/types/saude';

const dayLabels: Record<SaudeDayOfWeek, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const saudeWeekDays: SaudeDayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const saudeSyncResourceOptions = [
  { value: 'medicamentos_estoque', label: 'Estoque de medicamentos' },
  { value: 'medicamentos_ranking', label: 'Ranking de medicamentos' },
  { value: 'medicamentos_dispensados_mensal', label: 'Dispensação mensal' },
  { value: 'medicamentos_atendimentos_mensal', label: 'Atendimentos mensais' },
  { value: 'quantitativos', label: 'Quantitativos epidemiológicos' },
  { value: 'pessoas_fisicas_juridicas', label: 'Tipos de pessoa' },
  { value: 'pessoas_por_mes', label: 'Pessoas por mês' },
  { value: 'procedimentos_por_tipo', label: 'Procedimentos por tipo' },
] as const;

export const saudeYearOptions = [...PERIODO_DADOS.anos].reverse();

export const getSaudeDayLabel = (day: SaudeDayOfWeek) => dayLabels[day];

export const formatLastSyncedLabel = (value: string | null | undefined) => {
  if (!value) {
    return 'Sincronização indisponível';
  }

  return `Atualizado em ${new Date(value).toLocaleString('pt-BR')}`;
};

export const formatScheduleSummary = (schedule: SaudeUnitScheduleItem) => {
  if (schedule.is_closed) {
    return `${getSaudeDayLabel(schedule.day_of_week)}: fechado`;
  }

  if (!schedule.opens_at || !schedule.closes_at) {
    return `${getSaudeDayLabel(schedule.day_of_week)}: horário indisponível`;
  }

  return `${getSaudeDayLabel(schedule.day_of_week)}: ${schedule.opens_at.slice(0, 5)} às ${schedule.closes_at.slice(0, 5)}`;
};

export const getLatestSync = (...values: Array<string | null | undefined>) => {
  const validValues = values.filter((value): value is string => Boolean(value));

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest
  );
};

export const parseSyncLogList = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [] as string[];
  }
};

export const formatSyncLogLabel = (log: SaudeSyncLogRecord) => {
  const resources = parseSyncLogList(log.resources_json);
  const years = parseSyncLogList(log.years_json);

  const parts = [
    log.trigger_type === 'manual' ? 'Manual' : 'Agendada',
    resources.length > 0 ? `${resources.length} recurso(s)` : 'sem recursos',
    years.length > 0 ? years.join(', ') : 'anos padrão',
  ];

  return parts.join(' · ');
};
