'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import Icon from '@/components/ui/Icon';

interface FilterPanelProps {
  className?: string;
}

export default function FilterPanel({ className = '' }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const anos = useAnosDisponiveis();

  const {
    anoSelecionado,
    tipoReceita,
    tipoDespesa,
    compararComAnoAnterior,
    mostrarProjecao,
    modoVisualizacao,
    setAnoSelecionado,
    setTipoReceita,
    setTipoDespesa,
    toggleCompararAnoAnterior,
    toggleMostrarProjecao,
    setModoVisualizacao,
    resetFilters,
  } = useDashboardFilters();

  const filtrosAtivosCount = [
    tipoReceita !== 'TODOS',
    tipoDespesa !== 'TODOS',
    compararComAnoAnterior,
    mostrarProjecao,
    modoVisualizacao !== 'ano',
  ].filter(Boolean).length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-surface-container-low text-on-surface
                   hover:bg-surface-container transition-all duration-200"
        style={{ boxShadow: 'var(--shadow-card)' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon name="tune" size={18} />
        <span className="text-label-md font-medium">Filtros</span>
        {filtrosAtivosCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-5 h-5 text-label-sm
                       bg-secondary text-on-secondary rounded-full font-bold"
          >
            {filtrosAtivosCount}
          </motion.span>
        )}
        <Icon
          name="expand_more"
          size={18}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-surface/50 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-80 rounded-2xl z-50 overflow-hidden
                         bg-surface-container-lowest backdrop-blur-xl"
              style={{ boxShadow: 'var(--shadow-ambient-lg)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <Icon name="tune" size={18} className="text-secondary" />
                  <h3 className="text-label-lg font-semibold text-on-surface">Filtros</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="close" size={18} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Year */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-label-md font-medium text-on-surface-variant">
                    <Icon name="calendar_today" size={16} />
                    Ano Base
                  </label>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                    className="select-field"
                  >
                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano} {ano === new Date().getFullYear() ? '(Atual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Revenue type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-label-md font-medium text-on-surface-variant">
                    <Icon name="layers" size={16} />
                    Tipo de Receita
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['TODOS', 'CORRENTE', 'CAPITAL'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoReceita(tipo)}
                        className={`px-3 py-2 text-label-md font-medium rounded-lg transition-all
                          ${tipoReceita === tipo
                            ? 'bg-secondary-container/40 text-on-secondary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        {tipo === 'TODOS' ? 'Todos' : tipo === 'CORRENTE' ? 'Corrente' : 'Capital'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expense type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-label-md font-medium text-on-surface-variant">
                    <Icon name="layers" size={16} />
                    Tipo de Despesa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['TODOS', 'CORRENTE', 'CAPITAL', 'CONTINGENCIA'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoDespesa(tipo)}
                        className={`px-3 py-2 text-label-md font-medium rounded-lg transition-all
                          ${tipoDespesa === tipo
                            ? 'bg-error-container/40 text-error'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        {tipo === 'TODOS' ? 'Todos' :
                         tipo === 'CORRENTE' ? 'Corrente' :
                         tipo === 'CAPITAL' ? 'Capital' : 'Conting.'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aggregation */}
                <div className="space-y-2">
                  <label className="text-label-md font-medium text-on-surface-variant">
                    Agregacao Temporal
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['mes', 'trimestre', 'semestre', 'ano'] as const).map((modo) => (
                      <button
                        key={modo}
                        onClick={() => setModoVisualizacao(modo)}
                        className={`px-2 py-1.5 text-label-md font-medium rounded-lg transition-all
                          ${modoVisualizacao === modo
                            ? 'bg-tertiary-container/40 text-on-tertiary-container'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        {modo.charAt(0).toUpperCase() + modo.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Comparar com ano anterior
                    </span>
                    <button
                      onClick={toggleCompararAnoAnterior}
                      className={`relative w-10 h-5 rounded-full transition-colors
                        ${compararComAnoAnterior ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: compararComAnoAnterior ? 20 : 2 }}
                        className="absolute top-0.5 w-4 h-4 bg-on-secondary rounded-full shadow-sm"
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <Icon name="trending_up" size={16} />
                      Mostrar projecao
                    </span>
                    <button
                      onClick={toggleMostrarProjecao}
                      className={`relative w-10 h-5 rounded-full transition-colors
                        ${mostrarProjecao ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: mostrarProjecao ? 20 : 2 }}
                        className="absolute top-0.5 w-4 h-4 bg-on-secondary rounded-full shadow-sm"
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 p-4 border-t border-outline-variant/20 bg-surface-container-low/50">
                <motion.button
                  onClick={() => {
                    resetFilters();
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                             text-label-md text-on-surface-variant
                             bg-surface-container-low rounded-lg
                             hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="restart_alt" size={16} />
                  Limpar
                </motion.button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2.5 text-label-md font-medium
                             text-on-primary bg-primary rounded-lg
                             hover:bg-primary-container transition-colors"
                >
                  Aplicar
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
