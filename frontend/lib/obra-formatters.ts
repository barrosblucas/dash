import type { ObraStatus } from '@/types/obra';

export const obraStatusLabels: Record<ObraStatus, string> = {
  em_andamento: 'Em andamento',
  paralisada: 'Paralisada',
  concluida: 'Concluída',
};

export const obraStatusTone: Record<ObraStatus, string> = {
  em_andamento: 'bg-secondary-container text-on-secondary-container',
  paralisada: 'bg-tertiary-container text-on-tertiary-container',
  concluida: 'bg-primary text-on-primary',
};

export const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
};
