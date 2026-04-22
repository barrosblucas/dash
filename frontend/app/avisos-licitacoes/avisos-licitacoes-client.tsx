'use client';

/**
 * Aviso de Licitações — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Calendário mensal/semanal + lista com filtros por fonte e status.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
} from 'date-fns';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLicitacoesComprasBR, useLicitacoesDispensas } from '@/hooks/useLicitacoes';
import type { LicitacaoUnified } from '@/types/licitacao';

import {
  FONTES,
  STATUSES,
  type ViewMode,
  type FonteFilter,
  type StatusFilter,
} from './constants';
import { parseComprasBR, parseDispensas } from './parsers';
import { getFeriados } from './feriados';
import { matchFonte, matchStatus } from './filters';
import { LicitacaoModal } from './licitacao-modal';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { ListView } from './list-view';

export default function AvisosLicitacoesClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [fonteFilter, setFonteFilter] = useState<FonteFilter>('todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalItem, setModalItem] = useState<LicitacaoUnified | null>(null);

  const { data: comprasbrData, isLoading: loadingCB, isError: errorCB } = useLicitacoesComprasBR();
  const { data: dispensasData, isLoading: loadingDisp, isError: errorDisp } = useLicitacoesDispensas();

  const isLoading = loadingCB || loadingDisp;
  const isError = errorCB || errorDisp;

  const unifiedItems = useMemo<LicitacaoUnified[]>(() => {
    const items: LicitacaoUnified[] = [];
    if (comprasbrData?.items) items.push(...parseComprasBR(comprasbrData.items));
    if (dispensasData?.items) items.push(...parseDispensas(dispensasData.items));
    return items;
  }, [comprasbrData, dispensasData]);

  const filteredItems = useMemo(() => {
    let items = unifiedItems;
    items = items.filter((i) => matchFonte(i, fonteFilter));
    items = items.filter((i) => matchStatus(i, statusFilter));
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.objeto.toLowerCase().includes(lower) ||
          i.numero.toLowerCase().includes(lower) ||
          i.modalidade.toLowerCase().includes(lower)
      );
    }
    return items;
  }, [unifiedItems, fonteFilter, statusFilter, searchTerm]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    return filteredItems.filter((i) => isSameDay(i.dataAbertura, selectedDay));
  }, [filteredItems, selectedDay]);

  const currentYear = currentDate.getFullYear();
  const feriados = useMemo(() => getFeriados(currentYear), [currentYear]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const dayIndicators = useMemo(() => {
    const map = new Map<string, { aguardando: boolean; encerrado: boolean; suspenso: boolean; dispensa: boolean }>();
    for (const item of filteredItems) {
      const key = format(item.dataAbertura, 'yyyy-MM-dd');
      const existing = map.get(key) || { aguardando: false, encerrado: false, suspenso: false, dispensa: false };
      if (item.status.startsWith('AGUARDANDO')) existing.aguardando = true;
      else if (item.status === 'ENCERRADO') existing.encerrado = true;
      else if (item.status === 'SUSPENSO') existing.suspenso = true;
      if (item.fonte === 'dispensa') existing.dispensa = true;
      map.set(key, existing);
    }
    return map;
  }, [filteredItems]);

  const navigatePrev = useCallback(() => {
    setCurrentDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  }, [viewMode]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  }, []);

  const [listPage, setListPage] = useState(0);
  const PAGE_SIZE = 15;

  const sortedListItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => b.dataAbertura.getTime() - a.dataAbertura.getTime());
  }, [filteredItems]);

  const pagedListItems = useMemo(() => {
    const start = listPage * PAGE_SIZE;
    return sortedListItems.slice(start, start + PAGE_SIZE);
  }, [sortedListItems, listPage]);

  const totalPages = Math.ceil(sortedListItems.length / PAGE_SIZE);

  useEffect(() => { setListPage(0); }, [fonteFilter, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    let aguardando = 0;
    let encerrado = 0;
    let suspenso = 0;
    for (const item of filteredItems) {
      if (item.status.startsWith('AGUARDANDO')) aguardando++;
      else if (item.status === 'ENCERRADO') encerrado++;
      else if (item.status === 'SUSPENSO') suspenso++;
    }
    return { total: filteredItems.length, aguardando, encerrado, suspenso };
  }, [filteredItems]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface dark:text-white">
          Avisos de Licitações
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Avisos e editais de processos licitatórios de Bandeirantes MS
        </p>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient">
          <p className="text-label-md text-on-surface-variant">Total</p>
          <p className="text-headline-sm font-display font-bold text-on-surface dark:text-white mt-1">{counts.total}</p>
        </div>
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient">
          <p className="text-label-md text-on-surface-variant">Aguardando</p>
          <p className="text-headline-sm font-display font-bold text-secondary dark:text-emerald-400 mt-1">{counts.aguardando}</p>
        </div>
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient">
          <p className="text-label-md text-on-surface-variant">Encerrado</p>
          <p className="text-headline-sm font-display font-bold text-on-surface-variant mt-1">{counts.encerrado}</p>
        </div>
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient">
          <p className="text-label-md text-on-surface-variant">Suspenso</p>
          <p className="text-headline-sm font-display font-bold text-error dark:text-red-400 mt-1">{counts.suspenso}</p>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-4 shadow-ambient space-y-3"
      >
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar por objeto, número ou modalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-high dark:bg-slate-700/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-on-surface dark:text-slate-200 placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px] flex-shrink-0">filter_alt</span>
            {FONTES.map((f) => (
              <button
                key={f.key}
                onClick={() => setFonteFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-label-md font-medium transition-colors ${
                  fonteFilter === f.key
                    ? 'bg-primary text-on-primary dark:bg-primary/80 dark:text-white shadow-ambient'
                    : 'bg-surface-container-high dark:bg-slate-700/40 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`rounded-full px-3 py-1.5 text-label-md font-medium transition-colors ${
                  statusFilter === s.key
                    ? 'bg-primary text-on-primary dark:bg-primary/80 dark:text-white shadow-ambient'
                    : 'bg-surface-container-high dark:bg-slate-700/40 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* View toggle pills */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-2"
      >
        {[
          { key: 'month' as ViewMode, icon: 'calendar_month', label: 'Mensal' },
          { key: 'week' as ViewMode, icon: 'grid_view', label: 'Semanal' },
          { key: 'list' as ViewMode, icon: 'list', label: 'Lista' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200 ${
              viewMode === key
                ? 'bg-primary text-on-primary dark:bg-primary/80 dark:text-white shadow-ambient'
                : 'bg-surface-container-high dark:bg-slate-700/40 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/60'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </button>
        ))}
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <LoadingSpinner size="lg" message="Carregando licitações..." className="py-20" />
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 text-center shadow-ambient">
          <span className="material-symbols-outlined text-error text-[32px] block mx-auto mb-3">warning</span>
          <p className="text-on-surface dark:text-white font-medium mb-1">Erro ao carregar licitações</p>
          <p className="text-sm text-on-surface-variant">Tente novamente mais tarde.</p>
        </div>
      )}

      {/* Month View */}
      {!isLoading && !isError && viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          monthDays={monthDays}
          selectedDay={selectedDay}
          selectedDayItems={selectedDayItems}
          dayIndicators={dayIndicators}
          feriados={feriados}
          onNavigatePrev={navigatePrev}
          onNavigateNext={navigateNext}
          onNavigateToday={navigateToday}
          onSelectDay={setSelectedDay}
          onOpenModal={setModalItem}
        />
      )}

      {/* Week View */}
      {!isLoading && !isError && viewMode === 'week' && (
        <WeekView
          weekDays={weekDays}
          filteredItems={filteredItems}
          selectedDay={selectedDay}
          selectedDayItems={selectedDayItems}
          feriados={feriados}
          onNavigatePrev={navigatePrev}
          onNavigateNext={navigateNext}
          onNavigateToday={navigateToday}
          onSelectDay={setSelectedDay}
          onOpenModal={setModalItem}
        />
      )}

      {/* List View */}
      {!isLoading && !isError && viewMode === 'list' && (
        <ListView
          pagedListItems={pagedListItems}
          sortedListItems={sortedListItems}
          totalPages={totalPages}
          listPage={listPage}
          searchTerm={searchTerm}
          onSetListPage={setListPage}
          onOpenModal={setModalItem}
        />
      )}

      {/* Modal */}
      {modalItem && <LicitacaoModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
