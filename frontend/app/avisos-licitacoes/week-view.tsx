/**
 * Visualização semanal do calendário de licitações
 */

import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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
          className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-display font-semibold text-dark-100">
          {format(weekDays[0], "dd 'de' MMM", { locale: ptBR })} –{' '}
          {format(weekDays[6], "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700/40 text-dark-300 hover:bg-dark-700/60 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={onNavigateNext}
            className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
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
              className={`rounded-xl border p-3 text-left transition-all min-h-[140px] flex flex-col ${
                isSelected
                  ? 'border-accent-500/40 bg-accent-500/10'
                  : today
                  ? 'border-forecast-500/30 bg-forecast-500/5'
                  : 'border-dark-700/50 bg-dark-800/50 hover:bg-dark-800/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    today ? 'text-forecast-400' : 'text-dark-500'
                  }`}
                >
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={`text-sm font-bold ${
                    today ? 'text-forecast-300' : 'text-dark-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {feriado && (
                <span className="text-[9px] text-red-400 font-medium mb-1 truncate">
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
                        ? 'bg-accent-500/20 text-accent-300'
                        : 'bg-forecast-500/20 text-forecast-300'
                    }`}
                  >
                    {extrairTituloSucinto(item.objeto) || item.numero}
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-dark-500 pl-1">+{items.length - 3} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Itens do dia selecionado (semana) */}
      {selectedDay && selectedDayItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-dark-300">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            <span className="text-dark-500 ml-2">({selectedDayItems.length})</span>
          </h3>
          <div className="space-y-2">
            {selectedDayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenModal(item)}
                className="w-full text-left rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 hover:bg-dark-800/70 hover:border-dark-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                      <FonteBadge fonte={item.fonte} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-dark-400 line-clamp-2">
                      {extrairTituloSucinto(item.objeto) || item.objeto}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
