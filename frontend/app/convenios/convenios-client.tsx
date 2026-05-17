'use client';

/**
 * Gestao de Convenios — Painel do Cidadao
 * Portal da Transparencia — Bandeirantes MS
 */

import { motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { useConveniosData } from './convenios-hooks';
import { ConveniosTabs, FilterBar, SearchInput, MonthSelector } from './convenios-filters';
import { SummaryCards } from './convenios-summary';
import { ConvenioTable } from './convenios-table';
import { ConvenioMobileCards, MovimentacaoMobileCards } from './convenios-mobile-cards';

export default function ConveniosClient() {
  const {
    ano, setAno,
    tipoFilter, setTipoFilter,
    esferaFilter, setEsferaFilter,
    searchTerm, setSearchTerm,
    sortField, sortDir,
    expandedNumero,
    activeTab, setActiveTab,
    selectedMes, setSelectedMes,
    data, isLoading, isError, error,
    movData, movLoading,
    filteredItems, resumo,
    handleSort, toggleExpand,
  } = useConveniosData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-headline-lg font-display font-bold text-on-surface">
          Gestao de Convenios
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Convenios firmados pela administracao publica municipal{' '}
          <span className="text-on-surface font-medium">{ano}</span>
        </p>
      </motion.div>

      {/* Tabs */}
      <ConveniosTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filters */}
      <FilterBar
        ano={ano}
        onAnoChange={setAno}
        tipoFilter={tipoFilter}
        onTipoFilterChange={setTipoFilter}
        esferaFilter={esferaFilter}
        onEsferaFilterChange={setEsferaFilter}
      />

      {/* Summary cards */}
      {activeTab === 'convenios' && resumo && !isLoading && (
        <SummaryCards resumo={resumo} />
      )}

      {/* Loading states */}
      {isLoading && activeTab === 'convenios' && (
        <LoadingSpinner size="lg" message="Carregando convenios..." className="py-20" />
      )}
      {movLoading && activeTab === 'movimentacoes' && (
        <LoadingSpinner size="lg" message="Carregando movimentacoes..." className="py-20" />
      )}

      {/* Error */}
      {isError && activeTab === 'convenios' && (
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

      {/* Convenios tab */}
      {activeTab === 'convenios' && data && !isLoading && !isError && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                handshake
              </span>
              <h2 className="text-headline-sm font-display text-on-surface">
                Convenios ({filteredItems.length})
              </h2>
            </div>
          </div>

          <SearchInput value={searchTerm} onChange={setSearchTerm} />

          <ConvenioMobileCards
            items={filteredItems}
            expandedNumero={expandedNumero}
            onToggleExpand={toggleExpand}
          />

          {filteredItems.length > 0 && (
            <ConvenioTable
              items={filteredItems}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              expandedNumero={expandedNumero}
              onToggleExpand={toggleExpand}
            />
          )}
        </motion.section>
      )}

      {/* Movimentacoes tab */}
      {activeTab === 'movimentacoes' && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <MonthSelector
            selectedMes={selectedMes}
            onChange={setSelectedMes}
            count={movData?.quantidade}
          />

          {movLoading && (
            <LoadingSpinner size="lg" message="Carregando movimentacoes..." className="py-12" />
          )}

          {movData && !movLoading && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
              {movData.items.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
                    info
                  </span>
                  <p className="text-on-surface-variant">
                    Nenhuma movimentacao encontrada para este periodo
                  </p>
                </div>
              ) : (
                <>
                  <MovimentacaoMobileCards items={movData.items} />

                  {/* Desktop movimentacoes table */}
                  <div className="hidden lg:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                          <th className="py-3 px-4 text-left">Convenio</th>
                          <th className="py-3 px-4 text-left">Lancamento</th>
                          <th className="py-3 px-4 text-left">Entidade</th>
                          <th className="py-3 px-4 text-left">Data</th>
                          <th className="py-3 px-4 text-left">Concedente</th>
                          <th className="py-3 px-4 text-left">Convenente</th>
                          <th className="py-3 px-4 text-left">Tipo</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movData.items.map((mov, i) => (
                          <tr
                            key={`${mov.convenio}-${mov.lancamento}-${i}`}
                            className="hover:bg-surface-container transition-colors border-t border-outline/10"
                          >
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface font-medium">
                                {mov.convenio}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface-variant">
                                {mov.lancamento}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface-variant">
                                {mov.entidade}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface-variant">
                                {mov.data}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface-variant max-w-[180px] truncate block">
                                {mov.concedente}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-on-surface-variant max-w-[180px] truncate block">
                                {mov.convenente}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${
                                  mov.tipo === 'receita'
                                    ? 'bg-[#22c55e18] text-[#22c55e]'
                                    : 'bg-[#f9731618] text-[#f97316]'
                                }`}
                              >
                                {mov.tipo === 'receita' ? 'Receita' : 'Despesa'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-on-surface">
                                {formatCurrency(mov.valor)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
