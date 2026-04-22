/**
 * Visualização mensal do calendário de licitações
 */

import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Icon from '@/components/ui/Icon';
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
    if (ind.aguardando) dots.push({ color: 'bg-secondary' });
    if (ind.encerrado) dots.push({ color: 'bg-outline' });
    if (ind.suspenso) dots.push({ color: 'bg-error' });
    if (ind.dispensa) dots.push({ color: 'bg-primary' });

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
          ${!isInMonth ? 'text-outline' : 'text-on-surface-variant'}
          ${isSelected ? 'bg-primary/15 ring-1 ring-primary/30 text-primary' : ''}
          ${today && !isSelected ? 'bg-surface-container-high text-on-surface font-semibold' : ''}
          ${hasItems && !isSelected ? 'hover:bg-surface-container-high cursor-pointer' : ''}
        `}
      >
        <span className={`${today ? 'w-6 h-6 flex items-center justify-center rounded-full bg-tertiary/15' : ''}`}>
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
      {/* Navegação do mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigatePrev}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-headline-sm font-display text-on-surface capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
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

      {/* Grid do calendário */}
      <div className="surface-card overflow-hidden">
        {/* Cabeçalho dias da semana */}
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
          <h3 className="text-sm font-semibold text-on-surface-variant">
            Licitações em{' '}
            <span className="text-primary">
              {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="text-on-surface-variant/50 ml-2">({selectedDayItems.length})</span>
          </h3>

          {selectedDayItems.length === 0 ? (
            <div className="surface-card p-6 text-center">
              <Icon name="calendar_today" size={32} className="text-outline mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">Nenhuma licitação nesta data</p>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
