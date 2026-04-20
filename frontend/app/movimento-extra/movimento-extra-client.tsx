'use client';

/**
 * Movimento Extra Orçamentário — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Modo: product-ui
 * Tom: Confiável, acessível, empoderador
 * Assinatura visual: "Painel de Controle do Cidadão" com cards interativos de fundos
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BarChart3,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  Eye,
  Calendar,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMovimentoExtra, useMovimentoExtraAnual } from '@/hooks/useMovimentoExtra';
import { formatCurrency } from '@/lib/utils';
import { COLORS, MESES, MESES_ABREV } from '@/lib/constants';
import type { MovimentoTipo, MovimentoExtraItem, FundoResumo, InsightItem, ResumoMensalItem } from '@/types/movimento-extra';
import { GLOSSARIO_FUNDOS } from '@/types/movimento-extra';

// ─── helpers ───────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 2 }, (_, i) => 2020 + i);

function getGlossaryKey(descricao: string): string {
  const upper = descricao.toUpperCase();
  if (upper.includes('FUNDEB')) return 'FUNDEB';
  if (upper.includes('FMAS') || upper.includes('ASSISTÊNCIA SOCIAL')) return 'FMAS';
  if (upper.includes('FMIS') || upper.includes('SAÚDE')) return 'FMIS';
  if (upper.includes('FMDCA') || upper.includes('CRIANÇA') || upper.includes('ADOLESCENTE')) return 'FMDCA';
  if (upper.includes('FUNCESP') || upper.includes('PREVIDÊNCIA') || upper.includes('APOSENTADOR')) return 'FUNCESP';
  return 'OUTROS';
}

function getGlossary(key: string) {
  return GLOSSARIO_FUNDOS[key] ?? GLOSSARIO_FUNDOS.OUTROS;
}

// ─── sub-components ────────────────────────────────────

/** Botão pill do tipo de filtro */
function TipoPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${
          active
            ? 'bg-forecast-500/20 text-forecast-300 border border-forecast-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
            : 'bg-dark-800/60 text-dark-400 border border-dark-700/50 hover:text-dark-300 hover:border-dark-600'
        }
      `}
    >
      {children}
    </button>
  );
}

/** Card de KPI */
function KpiCard({
  label,
  value,
  count,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: number;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-5 transition-all duration-200 hover:border-dark-600/60">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-dark-400">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-dark-100 tracking-tight">{formatCurrency(value)}</p>
      {count !== undefined && (
        <p className="text-xs text-dark-500 mt-1.5">{count} itens neste período</p>
      )}
    </div>
  );
}

/** Badge de tipo (R/D) */
function TipoBadge({ tipo }: { tipo: 'R' | 'D' }) {
  const isRevenue = tipo === 'R';
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${isRevenue ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}
      `}
    >
      {isRevenue ? 'Receita' : 'Despesa'}
    </span>
  );
}

/** Card de Fundo Resumo */
function FundoCard({
  fundo,
  onToggle,
  expanded,
}: {
  fundo: FundoResumo;
  onToggle: () => void;
  expanded: boolean;
}) {
  const glossary = getGlossary(getGlossaryKey(fundo.fundo));
  const total = fundo.total_receitas + fundo.total_despesas;
  const receitaPct = total > 0 ? (fundo.total_receitas / total) * 100 : 0;
  const despesaPct = total > 0 ? (fundo.total_despesas / total) * 100 : 0;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-dark-600/60"
    >
      {/* Header do fundo */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: glossary.cor }}
            />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-dark-100 truncate">
                {fundo.fundo}
              </h4>
              <p className="text-xs text-dark-500 truncate">{glossary.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Info tooltip */}
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-300 hover:bg-dark-700/50 transition-colors"
                aria-label={`Informações sobre ${fundo.fundo}`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-9 z-20 w-72 rounded-xl border border-dark-700/60 bg-dark-900 p-4 shadow-xl">
                  <p className="text-sm text-dark-200 mb-2">{glossary.descricao}</p>
                  <div className="border-t border-dark-700/50 pt-2">
                    <p className="text-xs text-dark-400">
                      <span className="text-forecast-400 font-medium">Impacto para você:</span>{' '}
                      {glossary.impacto_cidadao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Expandir */}
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-300 hover:bg-dark-700/50 transition-colors"
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Barra de proporção visual */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 rounded-full bg-dark-700/60 overflow-hidden flex">
            <div
              className="h-full bg-green-500/70 rounded-l-full transition-all duration-500"
              style={{ width: `${receitaPct}%` }}
            />
            <div
              className="h-full bg-orange-500/70 rounded-r-full transition-all duration-500"
              style={{ width: `${despesaPct}%` }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-dark-500 mb-0.5">Receitas</p>
            <p className="text-sm font-semibold text-green-400">
              {formatCurrency(fundo.total_receitas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500 mb-0.5">Despesas</p>
            <p className="text-sm font-semibold text-orange-400">
              {formatCurrency(fundo.total_despesas)}
            </p>
          </div>
        </div>

        <p className="text-xs text-dark-500 mt-2">
          {fundo.quantidade_itens} {fundo.quantidade_itens === 1 ? 'item' : 'itens'} neste fundo
        </p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-dark-700/40 bg-dark-900/40 px-5 py-3">
          <p className="text-xs text-dark-500 italic">
            Expandindo este fundo mostrará os itens individuais abaixo na tabela de resultados.
          </p>
        </div>
      )}
    </div>
  );
}

/** Linha de item na tabela/lista */
function ItemRow({ item }: { item: MovimentoExtraItem }) {
  const glossaryKey = getGlossaryKey(item.descricao);
  const glossary = getGlossary(glossaryKey);
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-4 hover:border-dark-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <div className="relative min-w-0">
            <p className="text-sm font-medium text-dark-200 truncate pr-6">
              {item.descricao}
            </p>
            <button
              onClick={() => setShowTip(!showTip)}
              className="absolute right-0 top-0 text-dark-600 hover:text-dark-400 transition-colors"
              aria-label="Glossário"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTip && (
              <div className="absolute left-0 top-6 z-10 w-64 rounded-lg border border-dark-700/60 bg-dark-900 p-3 shadow-xl">
                <p className="text-xs text-dark-300">{glossary.descricao}</p>
              </div>
            )}
          </div>
        </div>
        <TipoBadge tipo={item.tipo} />
      </div>
      <p className="text-xs text-dark-500 mb-2 truncate">{item.fornecedor}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-600">
          Entidade {item.ent_codigo} · Mês {item.mes}
        </span>
        <span
          className={`
            text-base font-bold
            ${item.tipo === 'R' ? 'text-green-400' : 'text-orange-400'}
          `}
        >
          {formatCurrency(item.valor_recebido)}
        </span>
      </div>
    </div>
  );
}

/** Linha de item para desktop (table row) */
function ItemTableRow({ item }: { item: MovimentoExtraItem }) {
  const glossaryKey = getGlossaryKey(item.descricao);
  const glossary = getGlossary(glossaryKey);

  return (
    <tr className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: glossary.cor }}
          />
          <span className="text-sm text-dark-200">{item.descricao}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-dark-400 max-w-[200px] truncate block">{item.fornecedor}</span>
      </td>
      <td className="py-3 px-4">
        <TipoBadge tipo={item.tipo} />
      </td>
      <td className="py-3 px-4 text-right">
        <span
          className={`text-sm font-semibold ${item.tipo === 'R' ? 'text-green-400' : 'text-orange-400'}`}
        >
          {formatCurrency(item.valor_recebido)}
        </span>
      </td>
    </tr>
  );
}

// ─── Insight & Annual sub-components ─────────────────

function InsightCard({
  insight,
  accentColor,
  rank,
}: {
  insight: InsightItem;
  accentColor: string;
  rank: number;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4 hover:border-dark-600/60 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {rank}
          </span>
          <h4 className="text-sm font-semibold text-dark-200">{insight.categoria}</h4>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTip(!showTip)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-dark-500 hover:text-dark-300 transition-colors"
            aria-label="Explicação"
          >
            <Info className="w-3 h-3" />
          </button>
          {showTip && (
            <div className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-dark-700/60 bg-dark-900 p-3 shadow-xl">
              <p className="text-xs text-dark-300">{insight.descricao}</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-lg font-bold text-dark-100 mb-1">
        {formatCurrency(insight.valor)}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-500">{insight.quantidade} itens</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {insight.percentual.toFixed(1)}%
        </span>
      </div>
      {/* Barra visual de percentual */}
      <div className="mt-2 h-1.5 rounded-full bg-dark-700/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(insight.percentual, 100)}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}

function MonthlyEvolutionBar({ item, maxVal }: { item: ResumoMensalItem; maxVal: number }) {
  const receitaW = maxVal > 0 ? (item.total_receitas / maxVal) * 100 : 0;
  const despesaW = maxVal > 0 ? (item.total_despesas / maxVal) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-dark-400 w-8 shrink-0">{MESES_ABREV[item.mes - 1]}</span>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-dark-700/40 rounded-full overflow-hidden">
            <div className="h-full bg-green-500/70 rounded-full" style={{ width: `${receitaW}%` }} />
          </div>
          <span className="text-xs text-green-400 w-20 text-right">{formatCurrency(item.total_receitas)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-dark-700/40 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500/70 rounded-full" style={{ width: `${despesaW}%` }} />
          </div>
          <span className="text-xs text-orange-400 w-20 text-right">{formatCurrency(item.total_despesas)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────

export default function MovimentoExtraClient() {
  // Filtros
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [tipo, setTipo] = useState<MovimentoTipo>('AMBOS');
  const [viewMode, setViewMode] = useState<'mensal' | 'anual'>('mensal');

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'descricao' | 'fornecedor' | 'valor_recebido'>('valor_recebido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedFundos, setExpandedFundos] = useState<Set<string>>(new Set());
  const [showGlossary, setShowGlossary] = useState(false);

  // Queries
  const { data, isLoading, isError, error } = useMovimentoExtra(ano, mes, tipo);
  const { data: dataAnual, isLoading: isLoadingAnual } = useMovimentoExtraAnual(ano);

  // Dados derivados
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.descricao.toLowerCase().includes(lower) ||
          i.fornecedor.toLowerCase().includes(lower)
      );
    }

    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'valor_recebido') return mult * (a.valor_recebido - b.valor_recebido);
      if (sortField === 'descricao') return mult * a.descricao.localeCompare(b.descricao);
      return mult * a.fornecedor.localeCompare(b.fornecedor);
    });
  }, [data?.items, searchTerm, sortField, sortDir]);

  const toggleFundo = useCallback((fundo: string) => {
    setExpandedFundos((prev) => {
      const next = new Set(prev);
      if (next.has(fundo)) next.delete(fundo);
      else next.add(fundo);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (field: typeof sortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('desc');
      }
    },
    [sortField]
  );

  // Insights automáticos
  const insights = useMemo(() => {
    if (!data) return [];
    const result: string[] = [];

    if (data.fundos_resumo.length > 0) {
      const top = [...data.fundos_resumo].sort(
        (a, b) => (b.total_receitas + b.total_despesas) - (a.total_receitas + a.total_despesas)
      )[0];
      const totalMov = top.total_receitas + top.total_despesas;
      if (totalMov > 0) {
        result.push(
          `O fundo com maior movimentação foi ${top.fundo} com ${formatCurrency(totalMov)}.`
        );
      }
    }

    if (data.saldo !== 0) {
      if (data.saldo > 0) {
        result.push(
          `Neste período, as receitas superaram as despesas em ${formatCurrency(data.saldo)}.`
        );
      } else {
        result.push(
          `Neste período, as despesas superaram as receitas em ${formatCurrency(Math.abs(data.saldo))}.`
        );
      }
    }

    if (data.fundos_resumo.length > 0) {
      result.push(
        `${data.fundos_resumo.length} ${data.fundos_resumo.length === 1 ? 'fundo teve' : 'fundos tiveram'} movimentação neste período.`
      );
    }

    return result;
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-forecast-500/15 flex items-center justify-center text-forecast-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-dark-100">
                Movimento Extra Orçamentário
              </h1>
            </div>
            <p className="text-sm text-dark-400 ml-[52px]">
              Movimentações financeiras extraordinárias por fundo municipal —{' '}
              <span className="text-dark-300">
                {viewMode === 'anual' ? `Ano ${ano}` : `${MESES[mes - 1]} ${ano}`}
              </span>
            </p>
          </div>

          <Link
            href="/"
            className="text-sm text-dark-400 hover:text-dark-200 transition-colors shrink-0 self-start sm:self-auto"
          >
            ← Voltar ao portal
          </Link>
        </div>

        {/* ─── Filter Bar (sticky mobile) ─── */}
        <div className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-dark-950/90 backdrop-blur-md border-b border-dark-700/30 sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Ano */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-500 shrink-0" />
              <select
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-1 focus:ring-forecast-500/50 flex-1 sm:flex-initial"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Mês — apenas no modo mensal */}
            {viewMode === 'mensal' && (
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-1 focus:ring-forecast-500/50"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* View mode toggle: Mensal | Anual */}
            <div className="flex items-center gap-1">
              <TipoPill active={viewMode === 'mensal'} onClick={() => setViewMode('mensal')}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Mensal
                </span>
              </TipoPill>
              <TipoPill active={viewMode === 'anual'} onClick={() => setViewMode('anual')}>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Anual
                </span>
              </TipoPill>
            </div>

            {/* Tipo toggle — apenas no modo mensal */}
            {viewMode === 'mensal' && (
              <div className="flex items-center gap-1">
                <TipoPill active={tipo === 'R'} onClick={() => setTipo('R')}>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Receitas
                  </span>
                </TipoPill>
                <TipoPill active={tipo === 'D'} onClick={() => setTipo('D')}>
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Despesas
                  </span>
                </TipoPill>
                <TipoPill active={tipo === 'AMBOS'} onClick={() => setTipo('AMBOS')}>
                  Ambos
                </TipoPill>
              </div>
            )}
          </div>
        </div>

        {/* ─── Loading ─── */}
        {(viewMode === 'mensal' && isLoading) && (
          <LoadingSpinner size="lg" message="Carregando movimentações..." className="py-20" />
        )}
        {(viewMode === 'anual' && isLoadingAnual) && (
          <LoadingSpinner size="lg" message="Carregando dados anuais..." className="py-20" />
        )}

        {/* ─── Error ─── */}
        {viewMode === 'mensal' && isError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium mb-1">Erro ao carregar dados</p>
            <p className="text-sm text-dark-400">
              {(error as Error)?.message || 'Tente novamente mais tarde.'}
            </p>
          </div>
        )}

        {/* ─── Mensal View ─── */}
        {viewMode === 'mensal' && data && !isLoading && !isError && (
          <>
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Total Receitas"
                value={data.total_receitas}
                count={data.items.filter((i) => i.tipo === 'R').length}
                icon={TrendingUp}
                accentColor={COLORS.revenue.DEFAULT}
              />
              <KpiCard
                label="Total Despesas"
                value={data.total_despesas}
                count={data.items.filter((i) => i.tipo === 'D').length}
                icon={TrendingDown}
                accentColor={COLORS.expense.DEFAULT}
              />
              <KpiCard
                label="Saldo"
                value={data.saldo}
                count={data.quantidade}
                icon={data.saldo >= 0 ? BarChart3 : AlertTriangle}
                accentColor={data.saldo >= 0 ? COLORS.forecast.DEFAULT : COLORS.expense.DEFAULT}
              />
            </div>

            {/* ─── Insight Cards do Mês ─── */}
            {(data.insights_receitas?.length > 0 || data.insights_despesas?.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-dark-500" />
                  <h2 className="text-lg font-semibold text-dark-200">Destaques do Mês</h2>
                </div>

                {/* Só Receitas — cards em linha horizontal */}
                {tipo === 'R' && data.insights_receitas?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {data.insights_receitas.map((insight, i) => (
                        <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Só Despesas — cards em linha horizontal */}
                {tipo === 'D' && data.insights_despesas?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-orange-400" />
                      <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {data.insights_despesas.map((insight, i) => (
                        <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ambos — duas colunas lado a lado */}
                {tipo === 'AMBOS' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {data.insights_receitas?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
                        </div>
                        <div className="space-y-3">
                          {data.insights_receitas.map((insight, i) => (
                            <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                          ))}
                        </div>
                      </div>
                    )}
                    {data.insights_despesas?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingDown className="w-4 h-4 text-orange-400" />
                          <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
                        </div>
                        <div className="space-y-3">
                          {data.insights_despesas.map((insight, i) => (
                            <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ─── Insight Banner ─── */}
            {insights.length > 0 && (
              <div className="rounded-xl border border-forecast-500/20 bg-forecast-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-forecast-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-forecast-300 mb-1.5">
                      Observações do período
                    </h3>
                    <ul className="space-y-1">
                      {insights.map((insight, i) => (
                        <li key={i} className="text-sm text-dark-300">
                          • {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Fund Summary Cards ─── */}
            {data.fundos_resumo.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-dark-500" />
                  <h2 className="text-lg font-semibold text-dark-200">Resumo por Fundo</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.fundos_resumo.map((fundo) => (
                    <FundoCard
                      key={fundo.fundo}
                      fundo={fundo}
                      expanded={expandedFundos.has(fundo.fundo)}
                      onToggle={() => toggleFundo(fundo.fundo)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ─── Items Table/List ─── */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-dark-200">
                  Itens ({filteredItems.length})
                </h2>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Buscar por descrição ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-200 placeholder:text-dark-600 focus:outline-none focus:ring-1 focus:ring-forecast-500/50"
                  />
                </div>
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-dark-500">Ordenar por:</span>
                {(
                  [
                    ['descricao', 'Descrição'],
                    ['fornecedor', 'Fornecedor'],
                    ['valor_recebido', 'Valor'],
                  ] as const
                ).map(([field, label]) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                      ${
                        sortField === field
                          ? 'bg-dark-700 text-dark-200'
                          : 'text-dark-500 hover:text-dark-400'
                      }
                    `}
                  >
                    {label}
                    {sortField === field && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Empty state */}
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400 font-medium mb-1">Nenhum item encontrado</p>
                  <p className="text-sm text-dark-500">
                    {searchTerm
                      ? 'Tente ajustar o termo de busca.'
                      : 'Nenhuma movimentação registrada para este período.'}
                  </p>
                </div>
              )}

              {/* Mobile: Cards */}
              <div className="space-y-3 lg:hidden">
                {filteredItems.map((item, i) => (
                  <ItemRow key={`${item.codigo}-${item.ent_codigo}-${i}`} item={item} />
                ))}
              </div>

              {/* Desktop: Table */}
              {filteredItems.length > 0 && (
                <div className="hidden lg:block rounded-xl border border-dark-700/50 bg-dark-800/30 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700/50 bg-dark-800/60">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                          Fornecedor
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, i) => (
                        <ItemTableRow key={`${item.codigo}-${item.ent_codigo}-${i}`} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ─── Glossary (collapsible) ─── */}
            <section className="pt-4">
              <button
                onClick={() => setShowGlossary(!showGlossary)}
                className="flex items-center gap-2 text-sm font-medium text-dark-300 hover:text-dark-200 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Glossário — O que cada termo significa?</span>
                {showGlossary ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showGlossary && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(GLOSSARIO_FUNDOS).map(([key, entry]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.cor }}
                        />
                        <h4 className="text-sm font-semibold text-dark-200">{key}</h4>
                      </div>
                      <p className="text-xs text-dark-400 mb-1.5">{entry.nome}</p>
                      <p className="text-sm text-dark-400 leading-relaxed">{entry.descricao}</p>
                      <div className="mt-2 pt-2 border-t border-dark-700/30">
                        <p className="text-xs text-forecast-400/80">
                          <span className="font-medium">Impacto para você:</span>{' '}
                          {entry.impacto_cidadao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ─── Anual View ─── */}
        {viewMode === 'anual' && dataAnual && !isLoadingAnual && (
          <>
            {/* Annual KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Receitas Anuais"
                value={dataAnual.total_receitas}
                icon={TrendingUp}
                accentColor="#22c55e"
              />
              <KpiCard
                label="Despesas Anuais"
                value={dataAnual.total_despesas}
                icon={TrendingDown}
                accentColor="#f97316"
              />
              <KpiCard
                label="Saldo Anual"
                value={dataAnual.saldo}
                icon={dataAnual.saldo >= 0 ? BarChart3 : AlertTriangle}
                accentColor={dataAnual.saldo >= 0 ? '#06b6d4' : '#f97316'}
              />
              {/* Total de Itens — card simples sem formatação de moeda */}
              <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-5 transition-all duration-200 hover:border-dark-600/60">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-dark-400">Total de Itens</span>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#a855f718', color: '#a855f7' }}
                  >
                    <ArrowLeftRight className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dark-100 tracking-tight">
                  {dataAnual.quantidade_total.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Monthly Evolution */}
            {dataAnual.evolucao_mensal?.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-dark-500" />
                  <h2 className="text-lg font-semibold text-dark-200">Evolução Mensal</h2>
                </div>
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      <span className="text-xs text-dark-400">Receitas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-orange-500/70" />
                      <span className="text-xs text-dark-400">Despesas</span>
                    </div>
                  </div>
                  {(() => {
                    const maxVal = Math.max(
                      ...dataAnual.evolucao_mensal.map(m => Math.max(m.total_receitas, m.total_despesas)),
                      1
                    );
                    return dataAnual.evolucao_mensal.map(item => (
                      <MonthlyEvolutionBar key={item.mes} item={item} maxVal={maxVal} />
                    ));
                  })()}
                </div>
              </section>
            )}

            {/* Annual Insights */}
            {(dataAnual.insights_receitas?.length > 0 || dataAnual.insights_despesas?.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-dark-500" />
                  <h2 className="text-lg font-semibold text-dark-200">Destaques do Ano</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dataAnual.insights_receitas?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
                      </div>
                      <div className="space-y-3">
                        {dataAnual.insights_receitas.map((insight, i) => (
                          <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                        ))}
                      </div>
                    </div>
                  )}
                  {dataAnual.insights_despesas?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-orange-400" />
                        <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
                      </div>
                      <div className="space-y-3">
                        {dataAnual.insights_despesas.map((insight, i) => (
                          <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
