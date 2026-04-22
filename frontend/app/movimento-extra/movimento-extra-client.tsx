'use client';

/**
 * Movimento Extra Orçamentário — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Cards tonais, pills arredondadas, tipografia display
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMovimentoExtra, useMovimentoExtraAnual } from '@/hooks/useMovimentoExtra';
import { formatCurrency } from '@/lib/utils';
import { MESES } from '@/lib/constants';
import type { MovimentoTipo } from '@/types/movimento-extra';

import { CURRENT_YEAR, YEARS } from './constants';
import { TipoPill } from './tipo-pill';
import { MensalView } from './mensal-view';
import { AnualView } from './anual-view';

export default function MovimentoExtraClient() {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [tipo, setTipo] = useState<MovimentoTipo>('AMBOS');
  const [viewMode, setViewMode] = useState<'mensal' | 'anual'>('mensal');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'descricao' | 'fornecedor' | 'valor_recebido'>('valor_recebido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedFundos, setExpandedFundos] = useState<Set<string>>(new Set());
  const [showGlossary, setShowGlossary] = useState(false);

  const { data, isLoading, isError, error } = useMovimentoExtra(ano, mes, tipo);
  const { data: dataAnual, isLoading: isLoadingAnual } = useMovimentoExtraAnual(ano);

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

  const insights = useMemo(() => {
    if (!data) return [];
    const result: string[] = [];
    if (data.fundos_resumo.length > 0) {
      const top = [...data.fundos_resumo].sort(
        (a, b) => (b.total_receitas + b.total_despesas) - (a.total_receitas + a.total_despesas)
      )[0];
      const totalMov = top.total_receitas + top.total_despesas;
      if (totalMov > 0) {
        result.push(`O fundo com maior movimentação foi ${top.fundo} com ${formatCurrency(totalMov)}.`);
      }
    }
    if (data.saldo !== 0) {
      if (data.saldo > 0) {
        result.push(`Neste período, as receitas superaram as despesas em ${formatCurrency(data.saldo)}.`);
      } else {
        result.push(`Neste período, as despesas superaram as receitas em ${formatCurrency(Math.abs(data.saldo))}.`);
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
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Movimento Extra Orçamentário
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Movimentações financeiras extraordinárias por fundo municipal —{' '}
          <span className="text-on-surface font-medium">
            {viewMode === 'anual' ? `Ano ${ano}` : `${MESES[mes - 1]} ${ano}`}
          </span>
        </p>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">filter_alt</span>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month selector — mensal mode only */}
          {viewMode === 'mensal' && (
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          )}

          {/* View toggle pills */}
          <div className="flex items-center gap-1">
            <TipoPill active={viewMode === 'mensal'} onClick={() => setViewMode('mensal')}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Mensal
              </span>
            </TipoPill>
            <TipoPill active={viewMode === 'anual'} onClick={() => setViewMode('anual')}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                Anual
              </span>
            </TipoPill>
          </div>

          {/* Tipo pills — mensal mode only */}
          {viewMode === 'mensal' && (
            <div className="flex items-center gap-1">
              <TipoPill active={tipo === 'R'} onClick={() => setTipo('R')}>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  Receitas
                </span>
              </TipoPill>
              <TipoPill active={tipo === 'D'} onClick={() => setTipo('D')}>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">trending_down</span>
                  Despesas
                </span>
              </TipoPill>
              <TipoPill active={tipo === 'AMBOS'} onClick={() => setTipo('AMBOS')}>
                Todos
              </TipoPill>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loading */}
      {(viewMode === 'mensal' && isLoading) && (
        <LoadingSpinner size="lg" message="Carregando movimentações..." className="py-20" />
      )}
      {(viewMode === 'anual' && isLoadingAnual) && (
        <LoadingSpinner size="lg" message="Carregando dados anuais..." className="py-20" />
      )}

      {/* Error */}
      {viewMode === 'mensal' && isError && (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-ambient">
          <span className="material-symbols-outlined text-error text-[32px] block mx-auto mb-3">warning</span>
          <p className="text-on-surface font-medium mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-on-surface-variant">
            {(error as Error)?.message || 'Tente novamente mais tarde.'}
          </p>
        </div>
      )}

      {/* Mensal View */}
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

      {/* Anual View */}
      {viewMode === 'anual' && dataAnual && !isLoadingAnual && (
        <AnualView dataAnual={dataAnual} />
      )}
    </div>
  );
}
