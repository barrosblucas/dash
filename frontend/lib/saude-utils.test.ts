import { describe, expect, it } from 'vitest';

import {
  formatDateInputValue,
  formatLastSyncedLabel,
  formatScheduleSummary,
  formatSyncLogLabel,
  formatTrendSummary,
  getSaudeDemographicColor,
  getSaudePeriodRange,
  getTopLabel,
  getLatestSync,
  getSaudeDayLabel,
  getYearFromDateInput,
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

  it('formata resumo de tendência com prioridade para label', () => {
    expect(
      formatTrendSummary({
        direction: 'up',
        label: 'Crescimento consistente no trimestre',
        delta: 12,
      })
    ).toBe('Crescimento consistente no trimestre');

    expect(formatTrendSummary({ direction: 'stable', delta: null })).toBe('Tendência estável');
    expect(formatTrendSummary(null)).toBe('Sem tendência histórica');
  });

  it('retorna o rótulo de maior valor em um ranking', () => {
    expect(
      getTopLabel([
        { label: 'Vacina A', value: 10 },
        { label: 'Vacina B', value: 18 },
      ])
    ).toBe('Vacina B');
    expect(getTopLabel([])).toBe('Sem dados');
  });

  it('formata data para campo input type=date', () => {
    expect(formatDateInputValue(new Date('2026-04-23T10:00:00Z'))).toBe('2026-04-23');
  });

  it('monta o intervalo padrão do ano respeitando a data de referência', () => {
    expect(getSaudePeriodRange(2026, new Date('2026-04-24T10:00:00Z'))).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-04-24',
    });

    expect(getSaudePeriodRange(2025, new Date('2026-04-24T10:00:00Z'))).toEqual({
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  });

  it('extrai o ano a partir do valor do input de data', () => {
    expect(getYearFromDateInput('2016-01-01')).toBe(2016);
    expect(getYearFromDateInput('')).toBeNull();
  });

  it('atribui cores distintas para categorias demográficas comuns', () => {
    expect(getSaudeDemographicColor('Feminino', 0)).toBe('#ec4899');
    expect(getSaudeDemographicColor('Masculino', 1)).toBe('#3b82f6');
    expect(getSaudeDemographicColor('Criança', 2)).toBe('#22c55e');
  });
});
