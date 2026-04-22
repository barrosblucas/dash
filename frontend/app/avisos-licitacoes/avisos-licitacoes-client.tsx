'use client';

/**
 * Aviso de Licitações — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Calendário mensal/semanal + lista com filtros por fonte e status.
 * Merge de dados ComprasBR + Quality Dispensas.
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

import Icon from '@/components/ui/Icon';
import DashboardLayout from '@/components/layouts/DashboardLayout';
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
  // Estado de navegação
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Filtros
  const [fonteFilter, setFonteFilter] = useState<FonteFilter>('todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [modalItem, setModalItem] = useState<LicitacaoUnified | null>(null);

  // Queries
  const { data: comprasbrData, isLoading: loadingCB, isError: errorCB } = useLicitacoesComprasBR();
  const { data: dispensasData, isLoading: loadingDisp, isError: errorDisp } = useLicitacoesDispensas();

  const isLoading = loadingCB || loadingDisp;
  const isError = errorCB || errorDisp;

  // Merge dos dados
  const unifiedItems = useMemo<LicitacaoUnified[]>(() => {
    const items: LicitacaoUnified[] = [];
    if (comprasbrData?.items) items.push(...parseComprasBR(comprasbrData.items));
    if (dispensasData?.items) items.push(...parseDispensas(dispensasData.items));
    return items;
  }, [comprasbrData, dispensasData]);

  // Filtros aplicados
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

  // Itens do dia selecionado
  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    return filteredItems.filter((i) => isSameDay(i.dataAbertura, selectedDay));
  }, [filteredItems, selectedDay]);

  // Feriados
  const currentYear = currentDate.getFullYear();
  const feriados = useMemo(() => getFeriados(currentYear), [currentYear]);

  // Calendário mensal
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Calendário semanal
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Indicadores de dia (dots)
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

  // Navegação
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

  // Lista com paginação
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

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setListPage(0);
  }, [fonteFilter, statusFilter, searchTerm]);

  // Contagem por status (KPIs)
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
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header monumental */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="notifications_active" size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-headline-md font-display text-on-surface">Aviso de Licitações</h1>
              <p className="text-body-sm text-on-surface-variant">Avisos e editais de processos licitatórios de Bandeirantes MS</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="metric-card">
            <p className="metric-label">Total</p>
            <p className="metric-value mt-1">{counts.total}</p>
          </div>
          <div className="metric-card bg-secondary/5">
            <p className="metric-label">Aguardando</p>
            <p className="metric-value text-secondary mt-1">{counts.aguardando}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Encerrado</p>
            <p className="metric-value text-on-surface-variant mt-1">{counts.encerrado}</p>
          </div>
          <div className="metric-card bg-error/5">
            <p className="metric-label">Suspenso</p>
            <p className="metric-value text-error mt-1">{counts.suspenso}</p>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="surface-card p-4 space-y-3"
        >
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Buscar por objeto, número ou modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 rounded-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Icon name="filter_alt" size={16} className="text-on-surface-variant flex-shrink-0" />
              {FONTES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFonteFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    fonteFilter === f.key
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s.key
                      ? 'bg-surface-container text-on-surface ring-1 ring-outline-variant/30'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs de visualização */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Icon name="calendar_month" size={18} />
            Mensal
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Icon name="grid_view" size={18} />
            Semanal
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Icon name="list" size={18} />
            Lista
          </button>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <LoadingSpinner size="lg" message="Carregando licitações..." className="py-20" />
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="surface-card p-6 text-center bg-error/5">
            <Icon name="warning" size={32} className="text-error mx-auto mb-3" />
            <p className="text-on-surface font-medium mb-1">Erro ao carregar licitações</p>
            <p className="text-sm text-on-surface-variant">Tente novamente mais tarde.</p>
          </div>
        )}

        {/* Calendar View (Month) */}
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

        {/* Calendar View (Week) */}
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
    </DashboardLayout>
  );
}
