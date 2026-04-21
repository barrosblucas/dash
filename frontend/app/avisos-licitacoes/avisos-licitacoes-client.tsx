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
  parseISO,
  parse,
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
  isSameMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Download,
  X,
  FileText,
  AlertTriangle,
  BellRing,
  Filter,
  LayoutGrid,
} from 'lucide-react';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLicitacoesComprasBR, useLicitacoesDispensas } from '@/hooks/useLicitacoes';
import type {
  LicitacaoUnified,
  LicitacaoComprasBR,
  DispensaLicitacao,
  FonteLicitacao,
} from '@/types/licitacao';

// ─── Constantes ─────────────────────────────────────

type ViewMode = 'month' | 'week' | 'list';
type FonteFilter = 'todas' | 'pregao' | 'dispensa' | 'concorrencia';
type StatusFilter = 'todas' | 'aguardando' | 'encerrado' | 'suspenso';

const COMPRASBR_URL =
  'https://comprasbr.com.br/pregao-eletronico/?estado=MS&idMunicipio=1275';
const QUALITY_URL =
  'https://avisolicitacao.qualitysistemas.com.br/prefeitura_municipal_de_bandeirantes';

const FONTES: { key: FonteFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pregao', label: 'Pregão Eletrônico' },
  { key: 'dispensa', label: 'Dispensa' },
  { key: 'concorrencia', label: 'Concorrência' },
];

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'encerrado', label: 'Encerrado' },
  { key: 'suspenso', label: 'Suspenso' },
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Helpers ────────────────────────────────────────

function parseComprasBR(raw: LicitacaoComprasBR[]): LicitacaoUnified[] {
  return raw
    .filter((item) => item?.dataAbertura)
    .map((item) => ({
      id: `comprasbr-${item.id}`,
      numero: item.numeroEdital || '',
      objeto: item.objeto || '',
      fonte: 'comprasbr' as FonteLicitacao,
      modalidade: item.modalidade || '',
      status: item.status || '',
      dataAbertura: parseISO(item.dataAbertura),
      urlExterna: COMPRASBR_URL,
      idOriginal: item.id,
      orgaoNome: item.orgaoNome || '',
    }));
}

function parseDispensas(raw: DispensaLicitacao[]): LicitacaoUnified[] {
  return raw
    .filter((item) => item?.dataAbertura)
    .map((item) => ({
      id: `dispensa-${item.codigo}`,
      numero: item.processo || item.codigo,
      objeto: item.objeto || '',
      fonte: 'dispensa' as FonteLicitacao,
      modalidade: 'DISPENSA',
      status: item.status || '',
      dataAbertura: parse(item.dataAbertura, 'dd/MM/yyyy', new Date()),
      dataJulgamento: item.dataJulgamento
        ? parse(item.dataJulgamento, 'dd/MM/yyyy', new Date())
        : undefined,
      urlExterna: QUALITY_URL,
      idOriginal: item.codigo,
    }));
}

/** Mapeia fonte/modalidade para filtro de fonte */
function matchFonte(item: LicitacaoUnified, filter: FonteFilter): boolean {
  if (filter === 'todas') return true;
  if (filter === 'pregao') return item.modalidade === 'PREGÃO ELETRÔNICO';
  if (filter === 'dispensa') return item.fonte === 'dispensa';
  if (filter === 'concorrencia') return item.modalidade === 'CONCORRÊNCIA';
  return true;
}

/** Mapeia status para filtro de status */
function matchStatus(item: LicitacaoUnified, filter: StatusFilter): boolean {
  if (filter === 'todas') return true;
  if (filter === 'aguardando') return item.status.startsWith('AGUARDANDO');
  if (filter === 'encerrado') return item.status === 'ENCERRADO';
  if (filter === 'suspenso') return item.status === 'SUSPENSO';
  return true;
}

// ─── Sub-componentes ─────────────────────────────────

/** Badge de status */
function StatusBadge({ status }: { status: string }) {
  const startsWith = status.startsWith('AGUARDANDO');
  let classes = 'bg-dark-700/60 text-dark-400';
  let label = status;

  if (startsWith) {
    classes = 'bg-green-500/15 text-green-400';
    label = 'Aguardando';
  } else if (status === 'ENCERRADO') {
    classes = 'bg-dark-700/60 text-dark-400';
    label = 'Encerrado';
  } else if (status === 'SUSPENSO') {
    classes = 'bg-orange-500/15 text-orange-400';
    label = 'Suspenso';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

/** Badge de fonte */
function FonteBadge({ fonte }: { fonte: FonteLicitacao }) {
  if (fonte === 'comprasbr') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-forecast-500/15 text-forecast-400">
        ComprasBR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/15 text-accent-400">
      Dispensa
    </span>
  );
}

/** Modal de detalhes da licitação */
function LicitacaoModal({
  item,
  onClose,
}: {
  item: LicitacaoUnified;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative w-full max-w-lg rounded-xl border border-dark-700/50 bg-dark-800/95 backdrop-blur-sm shadow-xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-dark-700/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-dark-100 truncate">{item.numero}</h3>
              <div className="flex items-center gap-2 mt-1">
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-dark-700/60 transition-colors text-dark-400 hover:text-dark-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Objeto */}
          <div>
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Objeto</p>
            <p className="text-sm text-dark-200 leading-relaxed">{item.objeto}</p>
          </div>

          {/* Detalhes em grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Modalidade</p>
              <p className="text-sm text-dark-200">{item.modalidade}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Data de Abertura</p>
              <p className="text-sm text-dark-200">
                {format(item.dataAbertura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {'orgaoNome' in (item as object) && String((item as unknown as Record<string, unknown>).orgaoNome) && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Órgão</p>
                <p className="text-sm text-dark-200">{String((item as unknown as Record<string, unknown>).orgaoNome)}</p>
              </div>
            )}
            {item.dataJulgamento && (
              <div>
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Data de Julgamento</p>
                <p className="text-sm text-dark-200">
                  {format(item.dataJulgamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-dark-700/50">
          <a
            href={item.urlExterna}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forecast-500/15 text-forecast-400 text-sm font-medium hover:bg-forecast-500/25 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver no portal
          </a>
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-dark-700/60 text-dark-300 text-sm font-medium hover:bg-dark-700 transition-colors"
            onClick={() => {
              /* Edital download placeholder — backend does not expose file yet */
              window.open(item.urlExterna, '_blank');
            }}
          >
            <Download className="w-4 h-4" />
            Download Edital
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────

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

    if (comprasbrData?.items) {
      items.push(...parseComprasBR(comprasbrData.items));
    }
    if (dispensasData?.items) {
      items.push(...parseDispensas(dispensasData.items));
    }

    return items;
  }, [comprasbrData, dispensasData]);

  // Filtros aplicados
  const filteredItems = useMemo(() => {
    let items = unifiedItems;

    // Filtro de fonte
    items = items.filter((i) => matchFonte(i, fonteFilter));

    // Filtro de status
    items = items.filter((i) => matchStatus(i, statusFilter));

    // Busca textual
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

  // ─── Calendário mensal ────────────────────────────

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // ─── Calendário semanal ───────────────────────────

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // ─── Indicadores de dia (dots) ────────────────────

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

  // ─── Navegação ────────────────────────────────────

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

  // ─── Lista com paginação ─────────────────────────

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

  // ─── Contagem por status (para KPIs) ──────────────

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

  // ─── Render helpers ───────────────────────────────

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

    return (
      <button
        key={key}
        onClick={() => setSelectedDay(day)}
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
        {renderDayDots(day)}
      </button>
    );
  }

  // ─── Render ───────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ─── Header ─── */}
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

        {/* ─── KPI Cards ─── */}
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

        {/* ─── Filtros ─── */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4 space-y-3">
          {/* Busca */}
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
            {/* Filtro de Fonte */}
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

            {/* Filtro de Status */}
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

        {/* ─── Tabs de visualização ─── */}
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

        {/* ─── Loading ─── */}
        {isLoading && (
          <LoadingSpinner size="lg" message="Carregando licitações..." className="py-20" />
        )}

        {/* ─── Error ─── */}
        {isError && !isLoading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium mb-1">Erro ao carregar licitações</p>
            <p className="text-sm text-dark-400">Tente novamente mais tarde.</p>
          </div>
        )}

        {/* ─── Calendar View (Month) ─── */}
        {!isLoading && !isError && viewMode === 'month' && (
          <div className="space-y-4">
            {/* Navegação do mês */}
            <div className="flex items-center justify-between">
              <button
                onClick={navigatePrev}
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
                  onClick={navigateToday}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700/40 text-dark-300 hover:bg-dark-700/60 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={navigateNext}
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
                        onClick={() => setModalItem(item)}
                        className="w-full text-left rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 hover:bg-dark-800/70 hover:border-dark-600/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                              <FonteBadge fonte={item.fonte} />
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="text-xs text-dark-400 line-clamp-2">{item.objeto}</p>
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
        )}

        {/* ─── Calendar View (Week) ─── */}
        {!isLoading && !isError && viewMode === 'week' && (
          <div className="space-y-4">
            {/* Navegação da semana */}
            <div className="flex items-center justify-between">
              <button
                onClick={navigatePrev}
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
                  onClick={navigateToday}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700/40 text-dark-300 hover:bg-dark-700/60 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={navigateNext}
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

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-xl border p-3 text-left transition-all min-h-[120px] flex flex-col ${
                      isSelected
                        ? 'border-accent-500/40 bg-accent-500/10'
                        : today
                        ? 'border-forecast-500/30 bg-forecast-500/5'
                        : 'border-dark-700/50 bg-dark-800/50 hover:bg-dark-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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

                    <div className="flex-1 space-y-1 overflow-hidden">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalItem(item);
                          }}
                          className={`text-[10px] leading-tight px-1.5 py-1 rounded truncate cursor-pointer ${
                            item.fonte === 'dispensa'
                              ? 'bg-accent-500/20 text-accent-300'
                              : 'bg-forecast-500/20 text-forecast-300'
                          }`}
                        >
                          {item.numero}
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
                      onClick={() => setModalItem(item)}
                      className="w-full text-left rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 hover:bg-dark-800/70 hover:border-dark-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                            <FonteBadge fonte={item.fonte} />
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="text-xs text-dark-400 line-clamp-2">{item.objeto}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── List View ─── */}
        {!isLoading && !isError && viewMode === 'list' && (
          <div className="space-y-4">
            {/* Desktop: Tabela */}
            {pagedListItems.length > 0 && (
              <div className="hidden lg:block rounded-xl border border-dark-700/50 bg-dark-800/30 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700/50 bg-dark-800/60">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Nº Edital / Processo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Objeto
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Fonte
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Data Abertura
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedListItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors cursor-pointer"
                        onClick={() => setModalItem(item)}
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-sm text-dark-300 truncate">{item.objeto}</p>
                        </td>
                        <td className="py-3 px-4">
                          <FonteBadge fonte={item.fonte} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-dark-300">
                            {format(item.dataAbertura, 'dd/MM/yyyy')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={item.urlExterna}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-forecast-400 hover:text-forecast-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Portal
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile: Cards */}
            <div className="space-y-2 lg:hidden">
              {pagedListItems.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400 font-medium mb-1">Nenhuma licitação encontrada</p>
                  <p className="text-sm text-dark-500">
                    {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
                  </p>
                </div>
              ) : (
                pagedListItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setModalItem(item)}
                    className="w-full text-left rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 hover:bg-dark-800/70 hover:border-dark-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                      <FonteBadge fonte={item.fonte} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-dark-400 line-clamp-2 mb-2">{item.objeto}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">
                        {format(item.dataAbertura, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-dark-500" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Desktop empty state */}
            {pagedListItems.length === 0 && (
              <div className="hidden lg:block text-center py-12">
                <CalendarIcon className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 font-medium mb-1">Nenhuma licitação encontrada</p>
                <p className="text-sm text-dark-500">
                  {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
                </p>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-dark-500">
                  Mostrando {listPage * PAGE_SIZE + 1}–{Math.min((listPage + 1) * PAGE_SIZE, sortedListItems.length)} de{' '}
                  {sortedListItems.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setListPage((p) => Math.max(0, p - 1))}
                    disabled={listPage === 0}
                    className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter((p) => Math.abs(p - listPage) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setListPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          p === listPage
                            ? 'bg-accent-500/20 text-accent-300'
                            : 'text-dark-400 hover:bg-dark-700/40'
                        }`}
                      >
                        {p + 1}
                      </button>
                    ))}
                  <button
                    onClick={() => setListPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={listPage >= totalPages - 1}
                    className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Modal ─── */}
        {modalItem && <LicitacaoModal item={modalItem} onClose={() => setModalItem(null)} />}
      </div>
    </DashboardLayout>
  );
}
