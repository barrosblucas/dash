/**
 * Utilitários e helpers para data/hora
 * Dashboard Financeiro - Bandeirantes MS
 */

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subYears,
  differenceInMonths,
  differenceInYears,
  differenceInDays,
  isAfter,
  isBefore,
  parseISO,
  isValid,
  addMonths,
  addYears,
  isWithinInterval,
  min,
  max,
} from 'date-fns';

import { ptBR } from 'date-fns/locale';

// Custom functions for semester (date-fns doesn't have these)
export function startOfSemester(date: Date): Date {
  const month = date.getMonth();
  const semesterStart = month < 6 ? 0 : 6;
  return new Date(date.getFullYear(), semesterStart, 1);
}

export function endOfSemester(date: Date): Date {
  const month = date.getMonth();
  const semesterEnd = month < 6 ? 5 : 11;
  return new Date(date.getFullYear(), semesterEnd + 1, 0);
}

// ============================================
// Parse e validação
// ============================================
// Parse e validação
// ============================================

/**
 * Converte string ISO para Date
 */
export function parseDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  return parseISO(dateStr);
}

/**
 * Verifica se é uma data válida
 */
export function isValidDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return isValid(d);
}

// ============================================
// Formatação
// ============================================

/**
 * Formata data em português
 */
export function formatDatePt(
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy'
): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return format(d, formatStr, { locale: ptBR });
}

/**
 * Formata mês/ano
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Formata ano
 */
export function formatYear(year: number): string {
  return String(year);
}

/**
 * Formata trimestre
 */
export function formatQuarter(quarter: number, year: number): string {
  return `${year} - ${quarter}º Trimestre`;
}

/**
 * Formata semestre
 */
export function formatSemester(semester: number, year: number): string {
  return `${year} - ${semester}º Semestre`;
}

/**
 * Formata período customizado
 */
export function formatPeriodRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  return `${formatDatePt(start, 'dd/MM/yyyy')} - ${formatDatePt(end, 'dd/MM/yyyy')}`;
}

// ============================================
 // Períodos
// ============================================

/**
 * Obtém início e fim do mês
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Obtém início e fim do ano
 */
export function getYearRange(year: number): { start: Date; end: Date } {
  const date = new Date(year, 0, 1);
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
}

/**
 * Obtém início e fim do trimestre
 */
export function getQuarterRange(
  year: number,
  quarter: number
): { start: Date; end: Date } {
  const month = (quarter - 1) * 3;
  const date = new Date(year, month, 1);
  return {
    start: startOfQuarter(date),
    end: endOfQuarter(date),
  };
}

/**
 * Obtém início e fim do semestre
 */
export function getSemesterRange(
  year: number,
  semester: number
): { start: Date; end: Date } {
  const month = (semester - 1) * 6;
  const date = new Date(year, month, 1);
  return {
    start: startOfSemester(date),
    end: endOfSemester(date),
  };
}

/**
 * Obtém o trimestre a partir do mês
 */
export function getQuarterFromMonth(month: number): number {
  return Math.ceil(month / 3);
}

/**
 * Obtém o semestre a partir do mês
 */
export function getSemesterFromMonth(month: number): number {
  return month <= 6 ? 1 : 2;
}

// ============================================
 // Arrays de datas
// ============================================

/**
 * Gera array de meses no período
 */
export function generateMonthRange(
  startDate: Date,
  endDate: Date
): Array<{ year: number; month: number; date: Date }> {
  const months: Array<{ year: number; month: number; date: Date }> = [];
  
  let current = startOfMonth(startDate);
  const end = endOfMonth(endDate);
  
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      date: new Date(current),
    });
    current = addMonths(current, 1);
  }
  
  return months;
}

/**
 * Gera array de anos no período
 */
export function generateYearRange(
  startYear: number,
  endYear: number
): number[] {
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );
}

/**
 * Gera array de datas para gráficos temporais
 */
export function generateTimelineData(
  startYear: number,
  endYear: number,
  data: Map<string, number>
): Array<{ date: Date; year: number; month: number; value: number }> {
  const months = generateMonthRange(
    new Date(startYear, 0, 1),
    new Date(endYear, 11, 31)
  );
  
  return months.map(({ year, month, date }) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return {
      date,
      year,
      month,
      value: data.get(key) || 0,
    };
  });
}

// ============================================
 // Comparações
// ============================================

/**
 * Calcula diferença em meses entre datas
 */
export function getMonthDiff(start: Date, end: Date): number {
  return differenceInMonths(end, start);
}

/**
 * Calcula diferença em anos entre datas
 */
export function getYearDiff(start: Date, end: Date): number {
  return differenceInYears(end, start);
}

/**
 * Calcula diferença em dias entre datas
 */
export function getDayDiff(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

/**
 * Verifica se data está em período
 */
export function isDateInRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  return isWithinInterval(date, { start, end });
}

/**
 * Obtém data mais antiga
 */
export function getOldestDate(dates: Date[]): Date {
  return min(dates);
}

/**
 * Obtém data mais recente
 */
export function getNewestDate(dates: Date[]): Date {
  return max(dates);
}

// ============================================
 // Manipulação
// ============================================

/**
 * Adiciona meses à data
 */
export function addMonthsToDate(date: Date, months: number): Date {
  return addMonths(date, months);
}

/**
 * Adiciona anos à data
 */
export function addYearsToDate(date: Date, years: number): Date {
  return addYears(date, years);
}

/**
 * Subtrai meses da data
 */
export function subtractMonths(date: Date, months: number): Date {
  return subMonths(date, months);
}

/**
 * Subtrai anos da data
 */
export function subtractYears(date: Date, years: number): Date {
  return subYears(date, years);
}

/**
 * Obtém data atual
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Obtém mês/ano atual
 */
export function getCurrentMonthYear(): { year: number; month: number } {
  const now = getCurrentDate();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/**
 * Verifica se data é futura
 */
export function isFutureDate(date: Date): boolean {
  return isAfter(date, getCurrentDate());
}

/**
 * Verifica se data é passada
 */
export function isPastDate(date: Date): boolean {
  return isBefore(date, getCurrentDate());
}

// ============================================
 // Helpers específicos do domínio
// ============================================

/**
 * Obtém último ano completo com dados
 * (Assume que dados até 2026 estão disponíveis)
 */
export function getLastCompleteDataYear(): number {
  const currentYear = getCurrentDate().getFullYear();
  // Assume que o último ano com dados completos é o atual ou anterior
  return Math.min(currentYear - 1, 2025);
}

/**
 * Verifica se período tem dados
 * (2016-2026)
 */
export function isPeriodWithData(year: number): boolean {
  return year >= 2016 && year <= 2026;
}

/**
 * Obtém próximo mês/ano
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Obtém mês/ano anterior
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}