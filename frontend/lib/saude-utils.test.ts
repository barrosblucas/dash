import { describe, expect, it } from 'vitest';

import {
  formatLastSyncedLabel,
  formatScheduleSummary,
  formatSyncLogLabel,
  getLatestSync,
  getSaudeDayLabel,
  parseSyncLogList,
} from '@/lib/saude-utils';

describe('saude-utils', () => {
  it('retorna rótulo traduzido do dia da semana', () => {
    expect(getSaudeDayLabel('monday')).toBe('Segunda-feira');
  });

  it('formata resumo de horário aberto e fechado', () => {
    expect(
      formatScheduleSummary({
        day_of_week: 'monday',
        opens_at: '07:00:00',
        closes_at: '17:00:00',
        is_closed: false,
      })
    ).toBe('Segunda-feira: 07:00 às 17:00');

    expect(
      formatScheduleSummary({
        day_of_week: 'sunday',
        opens_at: null,
        closes_at: null,
        is_closed: true,
      })
    ).toBe('Domingo: fechado');
  });

  it('seleciona a última data de sincronização disponível', () => {
    expect(getLatestSync('2026-04-22T10:00:00', '2026-04-23T09:00:00', null)).toBe(
      '2026-04-23T09:00:00'
    );
    expect(getLatestSync(null, undefined)).toBeNull();
  });

  it('faz parse resiliente dos logs de sincronização', () => {
    expect(parseSyncLogList('["2026","2025"]')).toEqual(['2026', '2025']);
    expect(parseSyncLogList('{"bad":true}')).toEqual([]);
    expect(parseSyncLogList('not-json')).toEqual([]);
  });

  it('monta rótulo legível de log de sincronização', () => {
    expect(
      formatSyncLogLabel({
        id: 1,
        trigger_type: 'manual',
        status: 'success',
        started_at: '2026-04-23T10:00:00',
        finished_at: '2026-04-23T10:05:00',
        resources_json: '["quantitativos","procedimentos_por_tipo"]',
        years_json: '["2026"]',
        error_message: null,
      })
    ).toBe('Manual · 2 recurso(s) · 2026');
  });

  it('gera fallback quando sincronização está indisponível', () => {
    expect(formatLastSyncedLabel(null)).toBe('Sincronização indisponível');
  });
});
