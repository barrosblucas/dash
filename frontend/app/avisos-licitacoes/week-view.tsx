/**
 * Visualização semanal do calendário de licitações
 * Design: The Architectural Archive — day columns with event cards
 */

import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigatePrev}
          className="p-2 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-700/40 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <h2 className="text-headline-sm font-display text-on-surface dark:text-white">
          {format(weekDays[0], "dd 'de' MMM", { locale: ptBR })} –{' '}
          {format(weekDays[6], "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToday}
            className="rounded-full px-3 py-1.5 text-label-md font-medium bg-surface-container-high dark:bg-slate-700/40 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={onNavigateNext}
            className="p-2 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-700/40 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Week grid */}
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
                  ? 'bg-primary/10 dark:bg-blue-900/20'
                  : today
                  ? 'bg-tertiary/5 dark:bg-amber-900/10'
                  : 'bg-surface-container-lowest dark:bg-slate-800/50 hover:bg-surface-container dark:hover:bg-slate-800/70'
              } shadow-ambient`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    today
                      ? 'text-tertiary dark:text-amber-400'
                      : isSelected
                      ? 'text-primary dark:text-blue-400'
                      : 'text-on-surface-variant dark:text-slate-400'
                  }`}
                >
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={`text-xs font-bold ${
                    today
                      ? 'w-5 h-5 flex items-center justify-center rounded-full bg-tertiary/20 dark:bg-amber-700/30 text-tertiary dark:text-amber-300'
                      : 'text-on-surface-variant dark:text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {feriado && (
                <p className="text-[9px] text-error dark:text-red-400 font-medium mb-1 line-clamp-1">{feriado}</p>
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
                        ? 'bg-primary/15 text-primary dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-tertiary/15 text-tertiary dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {extrairTituloSucinto(item.objeto) || item.numero}
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant/50 dark:text-slate-500 pl-1">
                    +{items.length - 3} mais
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail cards */}
      {selectedDay && selectedDayItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-on-surface-variant dark:text-slate-400">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            <span className="text-on-surface-variant/50 ml-2">({selectedDayItems.length})</span>
          </h3>
          <div className="space-y-2">
            {selectedDayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenModal(item)}
                className="w-full text-left bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient transition-all duration-200 hover:shadow-ambient-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-on-surface dark:text-white">{item.numero}</span>
                      <FonteBadge fonte={item.fonte} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {extrairTituloSucinto(item.objeto) || item.objeto}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0 mt-0.5">open_in_new</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
