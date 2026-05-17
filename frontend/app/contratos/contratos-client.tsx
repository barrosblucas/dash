'use client';

/**
 * Gestao de Contratos — Painel do Cidadao
 * Portal da Transparencia — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Cards tonais, pills arredondadas, tipografia display
 */

import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

import { useContratos } from './contratos-hooks';
import ContratosFilters from './contratos-filters';
import ContratosMobileCards from './contratos-mobile-cards';
import ContratosTable from './contratos-table';

export default function ContratosClient() {
  const {
    ano,
    setAno,
    tipoFilter,
    setTipoFilter,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    handleSort,
    expandedNumero,
    toggleExpand,
    data,
    isLoading,
    isError,
    error,
    resumo,
    filteredItems,
  } = useContratos();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Gestao de Contratos
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Contratos firmados pela administracao publica municipal{' '}
          <span className="text-on-surface font-medium">{ano}</span>
        </p>
      </motion.div>

      {/* Filter bar */}
      <ContratosFilters
        ano={ano}
        onAnoChange={setAno}
        tipoFilter={tipoFilter}
        onTipoFilterChange={setTipoFilter}
      />

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
              <span className="text-label-md text-on-surface-variant">
                Total Contratos
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#22c55e18] text-[#22c55e]">
                <span className="material-symbols-outlined text-[20px]">
                  description
                </span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {resumo.quantidade_contratos}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">
                Valor Total
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#06b6d418] text-[#06b6d4]">
                <span className="material-symbols-outlined text-[20px]">
                  account_balance_wallet
                </span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {formatCurrency(resumo.total_valor)}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">
                Principais
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#a855f718] text-[#a855f7]">
                <span className="material-symbols-outlined text-[20px]">
                  star
                </span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {resumo.quantidade_principais}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
            <div className="flex items-start justify-between mb-3">
              <span className="text-label-md text-on-surface-variant">
                Aditivos
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f9731618] text-[#f97316]">
                <span className="material-symbols-outlined text-[20px]">
                  edit_note
                </span>
              </div>
            </div>
            <p className="text-headline-lg font-display font-bold text-on-surface">
              {resumo.quantidade_aditivos}
            </p>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <LoadingSpinner
          size="lg"
          message="Carregando contratos..."
          className="py-20"
        />
      )}

      {/* Error */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-ambient"
        >
          <span className="material-symbols-outlined text-error text-[32px] block mx-auto mb-3">
            warning
          </span>
          <p className="text-on-surface font-medium mb-1">
            Erro ao carregar dados
          </p>
          <p className="text-sm text-on-surface-variant">
            {(error as Error)?.message || 'Tente novamente mais tarde.'}
          </p>
        </motion.div>
      )}

      {/* Items list */}
      {data && !isLoading && !isError && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                receipt_long
              </span>
              <h2 className="text-headline-sm font-display text-on-surface">
                Contratos ({filteredItems.length})
              </h2>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por numero, fornecedor ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-high rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            )}
          </div>

          <ContratosMobileCards
            items={filteredItems}
            expandedNumero={expandedNumero}
            onToggleExpand={toggleExpand}
          />

          <ContratosTable
            items={filteredItems}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            expandedNumero={expandedNumero}
            onToggleExpand={toggleExpand}
          />
        </motion.section>
      )}
    </div>
  );
}
