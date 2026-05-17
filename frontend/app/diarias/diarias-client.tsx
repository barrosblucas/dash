'use client';

/**
 * Diárias e Passagens — Painel do Cidadão
 * Portal da Transparência — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Cards tonais, pills arredondadas, tipografia display
 */

import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

import { useDiariasData, MES_LABELS } from './diarias-hooks';
import DiariasFilters from './diarias-filters';
import DiariasTable from './diarias-table';
import DiariasMobileCards from './diarias-mobile-cards';

export default function DiariasClient() {
  const {
    filters: { ano, mes, searchTerm, sortField, sortDir, expandedIndex },
    handlers: { setAno, setMes, setSearchTerm, handleSort, toggleExpand },
    data,
    isLoading,
    isError,
    error,
    filteredItems,
    resumo,
    maxMonthlyValue,
  } = useDiariasData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Diárias e Passagens
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Diárias e passagens concedidas pela administração pública municipal{' '}
          <span className="text-on-surface font-medium">{ano}</span>
        </p>
      </motion.div>

      {/* Filter bar */}
      <DiariasFilters ano={ano} mes={mes} setAno={setAno} setMes={setMes} />

      {/* Summary cards */}
      {resumo && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">Total Diárias</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#22c55e18] text-[#22c55e]">
                <span className="material-symbols-outlined text-[20px]">flight</span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {resumo.quantidade_total}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">Valor Total</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#06b6d418] text-[#06b6d4]">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {formatCurrency(resumo.total_valor)}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">Valor Devolvido</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f9731618] text-[#f97316]">
                <span className="material-symbols-outlined text-[20px]">undo</span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {formatCurrency(resumo.total_devolvido)}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">Valor Líquido</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#a855f718] text-[#a855f7]">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {formatCurrency(resumo.total_valor - resumo.total_devolvido)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Monthly evolution bars */}
      {resumo?.evolucao_mensal && resumo.evolucao_mensal.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient"
        >
          <h3 className="text-headline-sm font-display text-on-surface mb-4">
            Evolução Mensal
          </h3>
          <div className="space-y-2">
            {resumo.evolucao_mensal.map((m) => {
              const pct = maxMonthlyValue > 0 ? (m.total_valor / maxMonthlyValue) * 100 : 0;
              return (
                <div key={m.mes} className="flex items-center gap-3">
                  <span className="text-label-md text-on-surface-variant w-8 text-right">
                    {MES_LABELS[m.mes] || m.mes}
                  </span>
                  <div className="flex-1 h-5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className="text-label-md text-on-surface-variant w-28 text-right">
                    {formatCurrency(m.total_valor)}
                  </span>
                  <span className="text-label-sm text-outline w-12 text-right">
                    {m.quantidade}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <LoadingSpinner size="lg" message="Carregando diárias..." className="py-20" />
      )}

      {/* Error */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-ambient"
        >
          <span className="material-symbols-outlined text-error text-[32px] block mx-auto mb-3">warning</span>
          <p className="text-on-surface font-medium mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-on-surface-variant">
            {(error as Error)?.message || 'Tente novamente mais tarde.'}
          </p>
        </motion.div>
      )}

      {/* Search + Items list */}
      {data && !isLoading && !isError && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">receipt_long</span>
              <h2 className="text-headline-sm font-display text-on-surface">
                Registros ({filteredItems.length})
              </h2>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar por nome, destino ou histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-high rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
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

          {/* Mobile: card list */}
          <DiariasMobileCards
            filteredItems={filteredItems}
            expandedIndex={expandedIndex}
            onToggleExpand={toggleExpand}
          />

          {/* Desktop: table */}
          <DiariasTable
            filteredItems={filteredItems}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            expandedIndex={expandedIndex}
            onToggleExpand={toggleExpand}
          />
        </motion.section>
      )}
    </div>
  );
}
