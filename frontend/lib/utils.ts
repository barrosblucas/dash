/**
 * Utilitários de formatação
 * Dashboard Financeiro - Bandeirantes MS
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { FORMATOS } from './constants';

/**
 * Formata valor monetário
 */
export function formatCurrency(
  value: number,
  options?: {
    compact?: boolean;
    decimals?: number;
    showSymbol?: boolean;
  }
): string {
  const { compact = false, decimals = 2, showSymbol = true } = options || {};
  
  // Formatação compacta para valores grandes
  if (compact && Math.abs(value) >= FORMATOS.currency.compact.bilhao.valor) {
    const formatted = value / FORMATOS.currency.compact.bilhao.valor;
    const prefix = showSymbol ? 'R$ ' : '';
    return `${prefix}${formatted.toFixed(decimals)}${FORMATOS.currency.compact.bilhao.sufixo}`;
  }
  
  if (compact && Math.abs(value) >= FORMATOS.currency.compact.milhao.valor) {
    const formatted = value / FORMATOS.currency.compact.milhao.valor;
    const prefix = showSymbol ? 'R$ ' : '';
    return `${prefix}${formatted.toFixed(decimals)}${FORMATOS.currency.compact.milhao.sufixo}`;
  }
  
  if (compact && Math.abs(value) >= FORMATOS.currency.compact.milhar.valor) {
    const formatted = value / FORMATOS.currency.compact.milhar.valor;
    const prefix = showSymbol ? 'R$ ' : '';
    return `${prefix}${formatted.toFixed(decimals)}${FORMATOS.currency.compact.milhar.sufixo}`;
  }
  
  // Formatação padrão
  const formatter = new Intl.NumberFormat(FORMATOS.currency.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: FORMATOS.currency.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(
  value: number,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
  }
): string {
  const { decimals = 1, showSymbol = true } = options || {};
  
  const formatter = new Intl.NumberFormat(FORMATOS.percent.locale, {
    style: showSymbol ? 'percent' : 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value / 100);
}

/**
 * Formata número
 */
export function formatNumber(
  value: number,
  options?: {
    decimals?: number;
    useGrouping?: boolean;
  }
): string {
  const { decimals = FORMATOS.number.decimals.max, useGrouping = true } = options || {};
  
  const formatter = new Intl.NumberFormat(FORMATOS.number.locale, {
    minimumFractionDigits: Math.min(decimals, FORMATOS.number.decimals.min),
    maximumFractionDigits: decimals,
    useGrouping,
  });
  
  return formatter.format(value);
}

/**
 * Formata data
 */
export function formatDate(
  date: Date | string,
  format: keyof typeof FORMATOS.date.formats = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Formatação customizada
  if (format === 'short') {
    return d.toLocaleDateString(FORMATOS.date.locale);
  }
  
  if (format === 'month') {
    return d.toLocaleDateString(FORMATOS.date.locale, { year: 'numeric', month: 'long' });
  }
  
  if (format === 'year') {
    return d.toLocaleDateString(FORMATOS.date.locale, { year: 'numeric' });
  }
  
  if (format === 'monthShort') {
    return d.toLocaleDateString(FORMATOS.date.locale, { month: 'short' });
  }
  
  if (format === 'weekday') {
    return d.toLocaleDateString(FORMATOS.date.locale, { weekday: 'long' });
  }
  
  if (format === 'medium') {
    return d.toLocaleDateString(FORMATOS.date.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString(FORMATOS.date.locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  return d.toLocaleDateString(FORMATOS.date.locale);
}

/**
 * Formata período (mês/ano)
 */
export function formatPeriod(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return formatDate(date, 'month');
}

/**
 * Parse de valor monetário
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Calcula variação percentual
 */
export function calcVariation(
  current: number,
  previous: number
): { value: number; percent: number; direction: 'up' | 'down' | 'stable' } {
  const value = current - previous;
  
  let percent = 0;
  if (previous !== 0) {
    percent = ((current - previous) / previous) * 100;
  }
  
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'stable';
  
  return { value, percent, direction };
}

/**
 * Formata número grande de forma legível
 */
export function formatLargeNumber(value: number): string {
  const abs = Math.abs(value);
  
  if (abs >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`;
  }
  
  if (abs >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  
  if (abs >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  
  if (abs >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  
  return formatNumber(value);
}

/**
 * Gera cor para gráfico baseado no índice
 */
export function getChartColor(index: number, colors?: string[]): string {
  const palette = colors || [
    '#22c55e', '#f97316', '#06b6d4', '#a855f7', '#f43f5e',
    '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#14b8a6',
  ];
  
  return palette[index % palette.length];
}

/**
 * Gera gradiente CSS
 */
export function generateGradient(
  from: string,
  to: string,
  direction: string = '135deg'
): string {
  return `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`;
}

/**
 * Gera ID único
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Agrupa array por propriedade
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    
    return {
      ...groups,
      [groupKey]: [...(groups[groupKey] || []), item],
    };
  }, {} as Record<string, T[]>);
}

/**
 * Ordena array por propriedade
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Soma valores de propriedade
 */
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => {
    const value = item[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Calcula média de propriedade
 */
export function averageBy<T>(array: T[], key: keyof T): number {
  if (array.length === 0) return 0;
  return sumBy(array, key) / array.length;
}

/* ── Tailwind class merger ── */

/**
 * Combina classes do Tailwind de forma inteligente,
 * resolvendo conflitos (ex: padding, margin) via tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}