import { describe, expect, it } from 'vitest';

import {
  buildCreatePayload,
  buildSchedulePayload,
  createEmptySchedules,
  mapSchedulesToDrafts,
} from '@/components/admin/saude/saude-units-form-helpers';

describe('saude-units-form-helpers', () => {
  it('cria agenda vazia com sete dias', () => {
    expect(createEmptySchedules()).toHaveLength(7);
  });

  it('mapeia horários existentes para drafts editáveis', () => {
    expect(
      mapSchedulesToDrafts([
        { day_of_week: 'monday', opens_at: '07:00:00', closes_at: '17:00:00', is_closed: false },
      ])[0]
    ).toEqual({
      day_of_week: 'monday',
      opens_at: '07:00',
      closes_at: '17:00',
      is_closed: false,
    });
  });

  it('monta payload de criação sem strings vazias', () => {
    expect(
      buildCreatePayload({
        name: ' UBS Central ',
        unit_type: ' UBS ',
        address: ' Rua A ',
        neighborhood: '',
        phone: '',
        latitude: '-19.918',
        longitude: '-54.358',
        is_active: true,
        source: ' manual ',
      })
    ).toEqual({
      name: 'UBS Central',
      unit_type: 'UBS',
      address: 'Rua A',
      neighborhood: null,
      phone: null,
      latitude: -19.918,
      longitude: -54.358,
      is_active: true,
      source: 'manual',
    });
  });

  it('monta payload de horários preservando dias fechados', () => {
    expect(
      buildSchedulePayload([
        { day_of_week: 'monday', opens_at: '07:00', closes_at: '17:00', is_closed: false },
        { day_of_week: 'sunday', opens_at: '', closes_at: '', is_closed: true },
      ])
    ).toEqual([
      { day_of_week: 'monday', opens_at: '07:00:00', closes_at: '17:00:00', is_closed: false },
      { day_of_week: 'sunday', opens_at: null, closes_at: null, is_closed: true },
    ]);
  });
});
