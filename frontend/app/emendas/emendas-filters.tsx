'use client';

import { motion } from 'framer-motion';
import { YEARS } from './emendas-hooks';

interface EmendasFiltersProps {
  ano: number;
  onAnoChange: (ano: number) => void;
  tipoFilter: string | undefined;
  onTipoFilterChange: (tipo: string | undefined) => void;
  availableTipos: string[];
}

export default function EmendasFilters({
  ano,
  onAnoChange,
  tipoFilter,
  onTipoFilterChange,
  availableTipos,
}: EmendasFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        {/* Year selector */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            filter_alt
          </span>
          <select
            value={ano}
            onChange={(e) => onAnoChange(Number(e.target.value))}
            className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => onTipoFilterChange(undefined)}
            className={`rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200 ${
              tipoFilter === undefined
                ? 'bg-primary text-on-primary shadow-ambient'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Todos
          </button>
          {availableTipos.map((t) => (
            <button
              key={t}
              onClick={() => onTipoFilterChange(t)}
              className={`rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200 ${
                tipoFilter === t
                  ? 'bg-primary text-on-primary shadow-ambient'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
