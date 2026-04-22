/**
 * Visualização semanal do calendário de licitações
 */

import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Icon from '@/components/ui/Icon';
import type { LicitacaoUnified } from '@/types/licitacao';

import { extrairTituloSucinto } from './parsers';
import { FonteBadge } from './fonte-badge';
import { StatusBadge } from './status-badge';

interface WeekViewProps {
  weekDays: Date[];
  filteredItems: LicitacaoUnified[];
  selectedDay: Date | null;
  selectedDayItems: LicitacaoUnified[];
  feriados: Map<string, string>;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onSelectDay: (day: Date) => void;
  onOpenModal: (item: LicitacaoUnified) => void;
}

export function WeekView({
  weekDays,
  filteredItems,
  selectedDay,
  selectedDayItems,
  feriados,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onSelectDay,
  onOpenModal,
}: WeekViewProps) {
  return (
    <div className="space-y-4">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigatePrev}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <h2 className="text-headline-sm font-display text-on-surface">
          {format(weekDays[0], "dd 'de' MMM", { locale: ptBR })} –{' '}
          {format(weekDays[6], "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={onNavigateNext}
            className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      </div>

      {/* Grid semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = filteredItems.filter((i) => isSameDay(i.dataAbertura, day));
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const today = isToday(day);
          const feriado = feriados.get(key);

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`rounded-xl p-3 text-left transition-all min-h-[140px] flex flex-col ${
                isSelected
                  ? 'bg-primary/10 ring-1 ring-primary/25'
                  : today
                  ? 'bg-tertiary/5 ring-1 ring-tertiary/20'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    today ? 'text-tertiary' : 'text-on-surface-variant'
                  }`}
                >
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={`text-sm font-bold ${
                    today ? 'text-tertiary' : 'text-on-surface-variant'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {feriado && (
                <span className="text-[9px] text-error font-medium mb-1 truncate">
                  {feriado}
                </span>
              )}

              <div className="flex-1 space-y-1 overflow-hidden">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal(item);
                    }}
                    title={item.numero}
                    className={`text-[10px] leading-tight px-1.5 py-1 rounded truncate cursor-pointer ${
                      item.fonte === 'dispensa'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-tertiary/15 text-tertiary'
                    }`}
                  >
                    {extrairTituloSucinto(item.objeto) || item.numero}
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant/50 pl-1">+{items.length - 3} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Itens do dia selecionado (semana) */}
      {selectedDay && selectedDayItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-on-surface-variant">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            <span className="text-on-surface-variant/50 ml-2">({selectedDayItems.length})</span>
          </h3>
          <div className="space-y-2">
            {selectedDayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenModal(item)}
                className="w-full text-left surface-card p-4 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-on-surface">{item.numero}</span>
                      <FonteBadge fonte={item.fonte} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {extrairTituloSucinto(item.objeto) || item.objeto}
                    </p>
                  </div>
                  <Icon name="open_in_new" size={18} className="text-on-surface-variant flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
