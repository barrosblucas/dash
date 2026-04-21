/**
 * Filtros e formatação para licitações
 */

import { parseISO, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { LicitacaoUnified } from '@/types/licitacao';

import type { FonteFilter, StatusFilter } from './constants';

/** Mapeia fonte/modalidade para filtro de fonte */
export function matchFonte(item: LicitacaoUnified, filter: FonteFilter): boolean {
  if (filter === 'todas') return true;
  if (filter === 'pregao') return item.modalidade === 'PREGÃO ELETRÔNICO';
  if (filter === 'dispensa') return item.fonte === 'dispensa';
  if (filter === 'concorrencia') return item.modalidade === 'CONCORRÊNCIA';
  return true;
}

/** Mapeia status para filtro de status */
export function matchStatus(item: LicitacaoUnified, filter: StatusFilter): boolean {
  if (filter === 'todas') return true;
  if (filter === 'aguardando') return item.status.startsWith('AGUARDANDO');
  if (filter === 'encerrado') return item.status === 'ENCERRADO';
  if (filter === 'suspenso') return item.status === 'SUSPENSO';
  return true;
}

/** Formata data ISO para exibição amigável */
export function fmtIsoDate(iso: string | undefined): string {
  if (!iso) return '-';
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}
