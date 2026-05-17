'use client';

/**
 * Folha de Pagamento — Painel do Cidadao
 * Portal da Transparencia — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Cards tonais, pills arredondadas, tipografia display
 */

import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useFolhaData } from './folha-hooks';
import { FolhaFilters } from './folha-filters';
import { FolhaSummary, FolhaAggregatedTable } from './folha-summary';
import { FolhaTable } from './folha-table';
import { FolhaMobileCards } from './folha-mobile-cards';

export default function FolhaClient() {
  const {
    ano,
    mes,
    selectedOfficeId,
    selectedDepartmentId,
    setSelectedDepartmentId,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    expandedContract,
    showAggregated,
    setShowAggregated,
    data,
    isLoading,
    isError,
    error,
    officesLoading,
    resumo,
    anosDisponiveis,
    offices,
    departments,
    officeAggregated,
    filteredItems,
    handleSort,
    toggleExpand,
    onYearChange,
    onMonthChange,
    onOfficeChange,
  } = useFolhaData();

  const dataReady = data && !isLoading && !isError;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Folha de Pagamento
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Remuneracao dos servidores municipais de Bandeirantes MS
        </p>
      </motion.div>

      {/* Filter bar + search */}
      <FolhaFilters
        anosDisponiveis={anosDisponiveis}
        ano={ano}
        mes={mes}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        offices={offices}
        officesLoading={officesLoading}
        selectedOfficeId={selectedOfficeId}
        onOfficeChange={onOfficeChange}
        selectedDepartmentId={selectedDepartmentId}
        onDepartmentChange={setSelectedDepartmentId}
        departments={departments}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
      />

      {/* Summary cards */}
      <FolhaSummary resumo={resumo} isLoading={isLoading} />

      {/* Loading state */}
      {isLoading && (
        <LoadingSpinner
          size="lg"
          message="Carregando folha de pagamento..."
          className="py-20"
        />
      )}

      {/* Error state */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-container-lowest rounded-xl p-6 text-center shadow-ambient"
        >
          <span className="material-symbols-outlined text-error text-[32px] block mx-auto mb-3">
            warning
          </span>
          <p className="text-on-surface font-medium mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-on-surface-variant">
            {(error as Error)?.message || 'Tente novamente mais tarde.'}
          </p>
        </motion.div>
      )}

      {/* Data section */}
      {dataReady && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {/* Aggregated by Office */}
          <FolhaAggregatedTable
            items={officeAggregated}
            show={showAggregated}
            onToggle={() => setShowAggregated(!showAggregated)}
          />

          {/* Employee count */}
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              group
            </span>
            <h2 className="text-headline-sm font-display text-on-surface">
              Servidores ({filteredItems.length})
            </h2>
          </div>

          {/* Mobile: card list */}
          <FolhaMobileCards
            items={filteredItems}
            expandedContract={expandedContract}
            onToggleExpand={toggleExpand}
          />

          {/* Desktop: table */}
          <FolhaTable
            items={filteredItems}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            expandedContract={expandedContract}
            onToggleExpand={toggleExpand}
          />

          {/* Data source note */}
          <div className="mt-6 text-xs text-on-surface-variant text-center">
            <p>
              Fonte: Portal da Transparencia de Bandeirantes MS — Dados oficiais da folha de
              pagamento do municipio. Os valores refletem a remuneracao bruta, descontos legais e
              liquidos dos servidores municipais.
            </p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
