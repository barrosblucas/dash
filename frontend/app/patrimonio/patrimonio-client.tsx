'use client';

/**
 * Controle Patrimonial — Painel do Cidadao
 * Portal da Transparencia — Bandeirantes MS
 *
 * Design: The Architectural Archive
 * Cards tonais, pills arredondadas, tipografia display
 */

import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

import { usePatrimonioData } from './patrimonio-hooks';
import PatrimonioFilters from './patrimonio-filters';
import PatrimonioTable from './patrimonio-table';
import PatrimonioMobileCards from './patrimonio-mobile-cards';

export default function PatrimonioClient() {
  const {
    ano,
    setAno,
    tipoFilter,
    setTipoFilter,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    expandedDescricao,
    data,
    isLoading,
    isError,
    error,
    filteredItems,
    sortedGroups,
    totals,
    handleSort,
    toggleExpand,
  } = usePatrimonioData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Controle Patrimonial
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Bens moveis, imoveis e veiculos do municipio{' '}
          <span className="text-on-surface font-medium">{ano}</span>
        </p>
      </motion.div>

      {/* Filter bar */}
      <PatrimonioFilters
        ano={ano}
        setAno={setAno}
        tipoFilter={tipoFilter}
        setTipoFilter={setTipoFilter}
      />

      {/* Summary cards */}
      {data && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <SummaryCard
            label="Total Bens"
            value={totals.totalBens}
            icon="inventory_2"
            iconBg="#22c55e18"
            iconColor="#22c55e"
          />
          <SummaryCard
            label="Valor Total"
            value={formatCurrency(totals.totalValor)}
            icon="account_balance_wallet"
            iconBg="#06b6d418"
            iconColor="#06b6d4"
          />
          <SummaryCard
            label="Adquiridos"
            value={totals.totalAdquiridos}
            icon="add_circle"
            iconBg="#22c55e18"
            iconColor="#22c55e"
          />
          <SummaryCard
            label="Baixados"
            value={totals.totalBaixados}
            icon="remove_circle"
            iconBg="#f9731618"
            iconColor="#f97316"
          />
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <LoadingSpinner size="lg" message="Carregando patrimonio..." className="py-20" />
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
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                inventory
              </span>
              <h2 className="text-headline-sm font-display text-on-surface">
                Bens ({filteredItems.length})
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
              placeholder="Buscar por descricao ou tipo de bem..."
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

          {/* Mobile: card list (includes empty state) */}
          <PatrimonioMobileCards
            sortedGroups={sortedGroups}
            expandedDescricao={expandedDescricao}
            onToggle={toggleExpand}
          />

          {/* Desktop: table */}
          {filteredItems.length > 0 && (
            <PatrimonioTable
              sortedGroups={sortedGroups}
              expandedDescricao={expandedDescricao}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onToggle={toggleExpand}
            />
          )}
        </motion.section>
      )}
    </div>
  );
}

/* ── Small inline SummaryCard ── */

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
      <div className="flex items-start justify-between mb-3">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <p className="text-headline-lg font-display font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}
