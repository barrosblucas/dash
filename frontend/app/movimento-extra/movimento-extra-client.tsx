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
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMovimentoExtra, useMovimentoExtraAnual } from '@/hooks/useMovimentoExtra';
import { formatCurrency } from '@/lib/utils';
import { MESES } from '@/lib/constants';
import type { MovimentoTipo } from '@/types/movimento-extra';

import { CURRENT_YEAR, YEARS } from './constants';
import { TipoPill } from './tipo-pill';
import { MensalView } from './mensal-view';
import { AnualView } from './anual-view';

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
          <MensalView
            data={data}
            tipo={tipo}
            insights={insights}
            expandedFundos={expandedFundos}
            toggleFundo={toggleFundo}
            filteredItems={filteredItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortField={sortField}
            sortDir={sortDir}
            handleSort={handleSort}
            showGlossary={showGlossary}
            setShowGlossary={setShowGlossary}
          />
        )}

        {/* ─── Anual View ─── */}
        {viewMode === 'anual' && dataAnual && !isLoadingAnual && (
          <AnualView dataAnual={dataAnual} />
        )}
      </div>
    </DashboardLayout>
  );
}
