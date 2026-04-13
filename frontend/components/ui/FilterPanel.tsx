'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Calendar, 
  ChevronDown, 
  RotateCcw,
  TrendingUp,
  Layers
} from 'lucide-react';

import { useDashboardFilters, useAnosDisponiveis, useFiltrosAtivos } from '@/stores/filtersStore';
import { PERIODO_DADOS } from '@/lib/constants';

interface FilterPanelProps {
  className?: string;
}

export default function FilterPanel({ className = '' }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const anos = useAnosDisponiveis();
  const filtrosAtivos = useFiltrosAtivos();
  
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

  // Contar filtros ativos
  const filtrosAtivosCount = [
    tipoReceita !== 'TODOS',
    tipoDespesa !== 'TODOS',
    compararComAnoAnterior,
    mostrarProjecao,
    modoVisualizacao !== 'ano',
  ].filter(Boolean).length;

  return (
    <div className={`relative ${className}`}>
      {/* Botão de Filtros */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 glass-card hover:bg-dark-800/50 
                   transition-all duration-200 rounded-xl border border-dark-700 
                   hover:border-forecast-accent/50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4 text-dark-300" />
        <span className="text-sm font-medium text-dark-200">Filtros</span>
        {filtrosAtivosCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-5 h-5 text-xs 
                       bg-forecast-accent text-dark-950 rounded-full font-bold"
          >
            {filtrosAtivosCount}
          </motion.span>
        )}
        <ChevronDown 
          className={`w-4 h-4 text-dark-400 transition-transform duration-200 
                      ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Painel de Filtros */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-40"
            />

            {/* Painel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-80 glass-card rounded-2xl 
                         border border-dark-700 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-forecast-accent" />
                  <h3 className="text-sm font-semibold text-dark-100">Filtros</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-dark-400" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Ano Base */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-300">
                    <Calendar className="w-3.5 h-3.5" />
                    Ano Base
                  </label>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-dark-600 
                               rounded-lg text-sm text-dark-100 focus:outline-none 
                               focus:border-forecast-accent transition-colors"
                  >
                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano} {ano === new Date().getFullYear() ? '(Atual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Receita */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-300">
                    <Layers className="w-3.5 h-3.5" />
                    Tipo de Receita
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['TODOS', 'CORRENTE', 'CAPITAL'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoReceita(tipo)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all
                                   ${tipoReceita === tipo
                                     ? 'bg-revenue-500/20 text-revenue-accent border border-revenue-500/50'
                                     : 'bg-dark-800/50 text-dark-300 border border-dark-700 hover:border-dark-600'
                                   }`}
                      >
                        {tipo === 'TODOS' ? 'Todos' : tipo === 'CORRENTE' ? 'Corrente' : 'Capital'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Despesa */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-300">
                    <Layers className="w-3.5 h-3.5" />
                    Tipo de Despesa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['TODOS', 'CORRENTE', 'CAPITAL', 'CONTINGENCIA'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoDespesa(tipo)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all
                                   ${tipoDespesa === tipo
                                     ? 'bg-expense-500/20 text-expense-accent border border-expense-500/50'
                                     : 'bg-dark-800/50 text-dark-300 border border-dark-700 hover:border-dark-600'
                                   }`}
                      >
                        {tipo === 'TODOS' ? 'Todos' : 
                         tipo === 'CORRENTE' ? 'Corrente' : 
                         tipo === 'CAPITAL' ? 'Capital' : 'Contingência'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modo de Visualização */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-dark-300">
                    Agregação Temporal
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['mes', 'trimestre', 'semestre', 'ano'] as const).map((modo) => (
                      <button
                        key={modo}
                        onClick={() => setModoVisualizacao(modo)}
                        className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all
                                   ${modoVisualizacao === modo
                                     ? 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                                     : 'bg-dark-800/50 text-dark-300 border border-dark-700 hover:border-dark-600'
                                   }`}
                      >
                        {modo.charAt(0).toUpperCase() + modo.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opções Adicionais */}
                <div className="space-y-3 pt-2 border-t border-dark-700">
                  {/* Comparar com Ano Anterior */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-dark-300 group-hover:text-dark-200 transition-colors">
                      Comparar com ano anterior
                    </span>
                    <button
                      onClick={toggleCompararAnoAnterior}
                      className={`relative w-10 h-5 rounded-full transition-colors
                                 ${compararComAnoAnterior ? 'bg-forecast-500' : 'bg-dark-700'}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: compararComAnoAnterior ? 20 : 2 }}
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </label>

                  {/* Mostrar Projeção */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="flex items-center gap-1.5 text-xs text-dark-300 group-hover:text-dark-200 transition-colors">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Mostrar projeção
                    </span>
                    <button
                      onClick={toggleMostrarProjecao}
                      className={`relative w-10 h-5 rounded-full transition-colors
                                 ${mostrarProjecao ? 'bg-forecast-500' : 'bg-dark-700'}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: mostrarProjecao ? 20 : 2 }}
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 p-4 border-t border-dark-700 bg-dark-900/50">
                <motion.button
                  onClick={() => {
                    resetFilters();
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                             text-sm text-dark-300 hover:text-dark-100 
                             bg-dark-800/50 rounded-lg border border-dark-700
                             hover:border-dark-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-dark-950 
                             bg-forecast-accent rounded-lg hover:bg-forecast-400 
                             transition-colors"
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