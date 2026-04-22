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
import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
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
      <div className="space-y-8">
        {/* ─── Header monumental ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center">
                <Icon name="sync_alt" size={20} className="text-tertiary" />
              </div>
              <h1 className="text-display-sm font-display text-on-surface">
                Movimento Extra Orçamentário
              </h1>
            </div>
            <p className="text-body-md text-on-surface-variant ml-[52px]">
              Movimentações financeiras extraordinárias por fundo municipal —{' '}
              <span className="text-on-surface">
                {viewMode === 'anual' ? `Ano ${ano}` : `${MESES[mes - 1]} ${ano}`}
              </span>
            </p>
          </div>
        </motion.div>

        {/* ─── Filter Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-surface/90 backdrop-blur-md sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Ano */}
            <div className="flex items-center gap-2">
              <Icon name="filter_alt" size={18} className="text-on-surface-variant shrink-0" />
              <select
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="select-field w-auto"
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
                className="select-field w-auto"
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
                  <Icon name="calendar_month" size={16} />
                  Mensal
                </span>
              </TipoPill>
              <TipoPill active={viewMode === 'anual'} onClick={() => setViewMode('anual')}>
                <span className="flex items-center gap-1.5">
                  <Icon name="bar_chart" size={16} />
                  Anual
                </span>
              </TipoPill>
            </div>

            {/* Tipo toggle — apenas no modo mensal */}
            {viewMode === 'mensal' && (
              <div className="flex items-center gap-1">
                <TipoPill active={tipo === 'R'} onClick={() => setTipo('R')}>
                  <span className="flex items-center gap-1.5">
                    <Icon name="trending_up" size={16} />
                    Receitas
                  </span>
                </TipoPill>
                <TipoPill active={tipo === 'D'} onClick={() => setTipo('D')}>
                  <span className="flex items-center gap-1.5">
                    <Icon name="trending_down" size={16} />
                    Despesas
                  </span>
                </TipoPill>
                <TipoPill active={tipo === 'AMBOS'} onClick={() => setTipo('AMBOS')}>
                  Ambos
                </TipoPill>
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── Loading ─── */}
        {(viewMode === 'mensal' && isLoading) && (
          <LoadingSpinner size="lg" message="Carregando movimentações..." className="py-20" />
        )}
        {(viewMode === 'anual' && isLoadingAnual) && (
          <LoadingSpinner size="lg" message="Carregando dados anuais..." className="py-20" />
        )}

        {/* ─── Error ─── */}
        {viewMode === 'mensal' && isError && (
          <div className="surface-card p-6 text-center bg-error/5">
            <Icon name="warning" size={32} className="text-error mx-auto mb-3" />
            <p className="text-on-surface font-medium mb-1">Erro ao carregar dados</p>
            <p className="text-sm text-on-surface-variant">
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
