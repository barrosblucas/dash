'use client';

/**
 * Aviso de Licitações — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Calendário mensal/semanal + lista com filtros por fonte e status.
 * Merge de dados ComprasBR + Quality Dispensas.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import {
  Calendar as CalendarIcon,
  List,
  Search,
  X,
  AlertTriangle,
  BellRing,
  Filter,
  LayoutGrid,
} from 'lucide-react';

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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-dark-100">Aviso de Licitações</h1>
              <p className="text-sm text-dark-400">Avisos e editais de processos licitatórios de Bandeirantes MS</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4">
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-display font-bold text-dark-100 mt-1">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">Aguardando</p>
            <p className="text-2xl font-display font-bold text-green-400 mt-1">{counts.aguardando}</p>
          </div>
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4">
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">Encerrado</p>
            <p className="text-2xl font-display font-bold text-dark-400 mt-1">{counts.encerrado}</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">Suspenso</p>
            <p className="text-2xl font-display font-bold text-orange-400 mt-1">{counts.suspenso}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar por objeto, número ou modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900/80 border border-dark-700/50 text-dark-200 text-sm placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
              {FONTES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFonteFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    fonteFilter === f.key
                      ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30'
                      : 'bg-dark-700/40 text-dark-400 hover:bg-dark-700/60 hover:text-dark-300'
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
                      ? 'bg-dark-600/60 text-dark-200 ring-1 ring-dark-500/50'
                      : 'bg-dark-700/40 text-dark-400 hover:bg-dark-700/60 hover:text-dark-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs de visualização */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30'
                : 'bg-dark-800/50 text-dark-400 hover:bg-dark-700/40 hover:text-dark-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Mensal
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30'
                : 'bg-dark-800/50 text-dark-400 hover:bg-dark-700/40 hover:text-dark-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Semanal
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30'
                : 'bg-dark-800/50 text-dark-400 hover:bg-dark-700/40 hover:text-dark-300'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <LoadingSpinner size="lg" message="Carregando licitações..." className="py-20" />
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium mb-1">Erro ao carregar licitações</p>
            <p className="text-sm text-dark-400">Tente novamente mais tarde.</p>
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
