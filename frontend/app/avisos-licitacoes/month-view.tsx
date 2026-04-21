/**
 * Visualização mensal do calendário de licitações
 */

import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon, ExternalLink } from 'lucide-react';

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
    if (ind.aguardando) dots.push({ color: 'bg-green-400' });
    if (ind.encerrado) dots.push({ color: 'bg-dark-500' });
    if (ind.suspenso) dots.push({ color: 'bg-orange-400' });
    if (ind.dispensa) dots.push({ color: 'bg-accent-400' });

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
          relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-all
          ${!isInMonth ? 'text-dark-600' : 'text-dark-300'}
          ${isSelected ? 'bg-accent-500/20 ring-1 ring-accent-500/40 text-accent-300' : ''}
          ${today && !isSelected ? 'bg-dark-700/50 text-dark-100 font-semibold' : ''}
          ${hasItems && !isSelected ? 'hover:bg-dark-700/40 cursor-pointer' : ''}
        `}
      >
        <span className={`${today ? 'w-6 h-6 flex items-center justify-center rounded-full bg-forecast-500/20' : ''}`}>
          {format(day, 'd')}
        </span>
        {feriado && (
          <span className="text-[9px] text-red-400 font-medium leading-tight text-center px-0.5 mt-0.5 line-clamp-2">
            {feriado}
          </span>
        )}
        {renderDayDots(day)}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigatePrev}
          className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-display font-semibold text-dark-100 capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
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

      {/* Grid do calendário */}
      <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm overflow-hidden">
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 border-b border-dark-700/50 bg-dark-800/60">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-semibold text-dark-500 uppercase tracking-wider"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7">
          {monthDays.map((day) => {
            const inMonth = isSameMonth(day, currentDate);
            return renderCalendarDay(day, inMonth);
          })}
        </div>
      </div>

      {/* Itens do dia selecionado */}
      {selectedDay && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-dark-300">
            Licitações em{' '}
            <span className="text-accent-300">
              {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="text-dark-500 ml-2">({selectedDayItems.length})</span>
          </h3>

          {selectedDayItems.length === 0 ? (
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-dark-600 mx-auto mb-2" />
              <p className="text-sm text-dark-400">Nenhuma licitação nesta data</p>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
