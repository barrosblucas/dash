/**
 * Visualização mensal do calendário de licitações
 * Design: The Architectural Archive — tonal calendar grid
 */

import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { LicitacaoUnified } from '@/types/licitacao';

import { DIAS_SEMANA } from './constants';
import { extrairTituloSucinto } from './parsers';
import { FonteBadge } from './fonte-badge';
import { StatusBadge } from './status-badge';

interface MonthViewProps {
  currentDate: Date;
  monthDays: Date[];
  selectedDay: Date | null;
  selectedDayItems: LicitacaoUnified[];
  dayIndicators: Map<string, { aguardando: boolean; encerrado: boolean; suspenso: boolean; dispensa: boolean }>;
  feriados: Map<string, string>;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onSelectDay: (day: Date) => void;
  onOpenModal: (item: LicitacaoUnified) => void;
}

export function MonthView({
  currentDate,
  monthDays,
  selectedDay,
  selectedDayItems,
  dayIndicators,
  feriados,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onSelectDay,
  onOpenModal,
}: MonthViewProps) {
  function renderDayDots(day: Date) {
    const key = format(day, 'yyyy-MM-dd');
    const ind = dayIndicators.get(key);
    if (!ind) return null;

    const dots: { color: string }[] = [];
    if (ind.aguardando) dots.push({ color: 'bg-secondary dark:bg-emerald-500' });
    if (ind.encerrado) dots.push({ color: 'bg-outline' });
    if (ind.suspenso) dots.push({ color: 'bg-error dark:bg-red-500' });
    if (ind.dispensa) dots.push({ color: 'bg-primary dark:bg-blue-400' });

    if (dots.length === 0) return null;

    return (
      <div className="flex items-center justify-center gap-0.5 mt-0.5">
        {dots.slice(0, 3).map((d, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
        ))}
      </div>
    );
  }

  function renderCalendarDay(day: Date, isInMonth: boolean) {
    const key = format(day, 'yyyy-MM-dd');
    const hasItems = dayIndicators.has(key);
    const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
    const today = isToday(day);
    const feriado = feriados.get(key);

    return (
      <button
        key={key}
        onClick={() => onSelectDay(day)}
        className={`
          relative flex flex-col items-center py-1.5 rounded-xl text-sm transition-all
          ${!isInMonth ? 'text-outline/40' : 'text-on-surface-variant'}
          ${isSelected ? 'bg-primary/15 dark:bg-blue-900/30 text-primary dark:text-blue-400' : ''}
          ${today && !isSelected ? 'bg-tertiary/10 text-on-surface font-semibold' : ''}
          ${hasItems && !isSelected ? 'hover:bg-surface-container-high cursor-pointer' : ''}
        `}
      >
        <span className={`${today ? 'w-6 h-6 flex items-center justify-center rounded-full bg-tertiary/15 dark:bg-amber-700/30' : ''}`}>
          {format(day, 'd')}
        </span>
        {feriado && (
          <span className="text-[9px] text-error font-medium leading-tight text-center px-0.5 mt-0.5 line-clamp-2">
            {feriado}
          </span>
        )}
        {renderDayDots(day)}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigatePrev}
          className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <div className="text-center">
          <h2 className="text-headline-sm font-display text-on-surface capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToday}
            className="rounded-full px-3 py-1.5 text-label-md font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={onNavigateNext}
            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 bg-surface-container-low">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {monthDays.map((day) => {
            const inMonth = isSameMonth(day, currentDate);
            return renderCalendarDay(day, inMonth);
          })}
        </div>
      </div>

      {/* Selected day items */}
      {selectedDay && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-on-surface-variant">
            Licitações em{' '}
            <span className="text-primary dark:text-blue-400">
              {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="text-on-surface-variant/50 ml-2">({selectedDayItems.length})</span>
          </h3>

          {selectedDayItems.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-ambient">
              <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">calendar_today</span>
              <p className="text-sm text-on-surface-variant">Nenhuma licitação nesta data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onOpenModal(item)}
                  className="w-full text-left bg-surface-container-lowest rounded-xl p-4 shadow-ambient transition-all duration-200 hover:shadow-ambient-lg"
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
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0 mt-0.5">open_in_new</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
