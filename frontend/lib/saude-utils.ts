import { PERIODO_DADOS } from '@/lib/constants';
import type {
  SaudeDayOfWeek,
  SaudeLabelValueItem,
  SaudeSyncLogRecord,
  SaudeTrendDirection,
  SaudeUnitScheduleItem,
} from '@/types/saude';

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
  { value: 'medicamentos_dispensados_mensal', label: 'Medicamentos dispensados por mês' },
  { value: 'medicamentos_atendimentos_mensal', label: 'Atendimentos de medicamentos por mês' },
  { value: 'quantitativos', label: 'Quantitativos epidemiológicos' },
  { value: 'atendimentos_por_sexo', label: 'Atendimentos por sexo' },
  { value: 'pessoas_fisicas_juridicas', label: 'Pessoas físicas e jurídicas' },
  { value: 'pessoas_por_mes', label: 'Pessoas por mês' },
  { value: 'procedimentos_por_tipo', label: 'Procedimentos por tipo' },
  { value: 'vacinas_por_mes', label: 'Vacinação por mês' },
  { value: 'vacinas_ranking', label: 'Ranking de vacinas' },
  { value: 'visitas_motivos', label: 'Visitas por motivo' },
  { value: 'visitas_acompanhamento', label: 'Visitas por acompanhamento' },
  { value: 'visitas_busca_ativa', label: 'Visitas por busca ativa' },
  { value: 'visitas_controle_vetorial', label: 'Visitas por controle vetorial' },
  { value: 'atencao_primaria_atendimentos_mensal', label: 'Atenção primária por mês' },
  { value: 'atencao_primaria_procedimentos', label: 'Procedimentos da atenção primária' },
  { value: 'atencao_primaria_cbo', label: 'Atendimentos por CBO' },
  { value: 'saude_bucal_atendimentos_mensal', label: 'Saúde bucal por mês' },
  { value: 'hospital_censo', label: 'Censo hospitalar' },
  { value: 'hospital_procedimentos', label: 'Procedimentos hospitalares' },
  { value: 'hospital_atendimentos_mensal', label: 'Atendimentos hospitalares por mês' },
] as const;

export const saudeYearOptions = [...PERIODO_DADOS.anos].reverse();

export const saudeFeatureCards = [
  {
    href: '/saude/medicamentos',
    title: 'Medicamentos',
    description: 'Estoque por estabelecimento com alerta de reposição e visão operacional da rede.',
    icon: 'medication',
    badge: 'US-01',
  },
  {
    href: '/saude/farmacia',
    title: 'Farmácia',
    description: 'Atendimentos e dispensações mensais separados do estoque público.',
    icon: 'vaccines',
    badge: 'US-10',
  },
  {
    href: '/saude/vacinacao',
    title: 'Vacinação',
    description: 'Cobertura anual, série mensal e ranking das vacinas mais aplicadas.',
    icon: 'immunology',
    badge: 'US-03',
  },
  {
    href: '/saude/visitas-domiciliares',
    title: 'Visitas domiciliares',
    description: 'Motivos, acompanhamento, busca ativa e controle vetorial em quatro recortes.',
    icon: 'home_health',
    badge: 'US-04',
  },
  {
    href: '/saude/perfil-epidemiologico',
    title: 'Perfil epidemiológico',
    description: 'Contadores assistenciais com tendência opcional e distribuição real por sexo.',
    icon: 'monitor_heart',
    badge: 'US-05',
  },
  {
    href: '/saude/atencao-primaria',
    title: 'Atenção primária',
    description: 'Produção mensal, procedimentos por especialidade e atendimentos por CBO.',
    icon: 'stethoscope',
    badge: 'US-07',
  },
  {
    href: '/saude/saude-bucal',
    title: 'Saúde bucal',
    description: 'Atendimentos odontológicos por mês com leitura rápida do período.',
    icon: 'dentistry',
    badge: 'US-08',
  },
  {
    href: '/saude/hospital',
    title: 'Hospital',
    description: 'Censo de leitos, internações, procedimentos e permanência com blocos explícitos de indisponibilidade.',
    icon: 'local_hospital',
    badge: 'US-09',
  },
  {
    href: '/saude/procedimentos',
    title: 'Procedimentos',
    description: 'Painel complementar da V1 com distribuição consolidada por tipo.',
    icon: 'analytics',
    badge: 'US-12',
  },
  {
    href: '/saude/unidades',
    title: 'Unidades',
    description: 'Mapa público com contatos, horários e navegação espacial das unidades.',
    icon: 'location_on',
    badge: 'US-14',
  },
] as const;

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

export const getTrendAccent = (direction?: SaudeTrendDirection | null) => {
  if (direction === 'up') {
    return 'text-secondary';
  }

  if (direction === 'down') {
    return 'text-red-300';
  }

  return 'text-tertiary';
};

export const getTrendIcon = (direction?: SaudeTrendDirection | null) => {
  if (direction === 'up') {
    return 'trending_up';
  }

  if (direction === 'down') {
    return 'trending_down';
  }

  return 'trending_flat';
};

export const formatTrendSummary = (
  trend?: {
    direction?: SaudeTrendDirection | null;
    label?: string | null;
    delta?: number | null;
  } | null
) => {
  if (!trend) {
    return 'Sem tendência histórica';
  }

  if (trend.label) {
    return trend.label;
  }

  if (typeof trend.delta === 'number') {
    const signal = trend.delta > 0 ? '+' : '';
    return `${signal}${trend.delta.toLocaleString('pt-BR')} vs. período anterior`;
  }

  if (trend.direction === 'up') {
    return 'Tendência de alta';
  }

  if (trend.direction === 'down') {
    return 'Tendência de queda';
  }

  return 'Tendência estável';
};

export const getTopLabel = (items: SaudeLabelValueItem[]) => {
  if (items.length === 0) {
    return 'Sem dados';
  }

  return items.reduce((top, item) => (item.value > top.value ? item : top)).label;
};

export const formatDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const hasChartData = (items: Array<{ value: number }> | null | undefined) =>
  Boolean(items && items.length > 0 && items.some((item) => item.value > 0));

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
