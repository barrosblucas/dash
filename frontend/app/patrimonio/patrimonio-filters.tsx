'use client';

import { motion } from 'framer-motion';

import { YEARS, TIPO_FILTERS } from './patrimonio-hooks';

interface PatrimonioFiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  tipoFilter: string | undefined;
  setTipoFilter: (tipo: string | undefined) => void;
}

export default function PatrimonioFilters({
  ano,
  setAno,
  tipoFilter,
  setTipoFilter,
}: PatrimonioFiltersProps) {
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
            onChange={(e) => setAno(Number(e.target.value))}
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
          {TIPO_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setTipoFilter(f.key)}
              className={`
                rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200
                ${
                  tipoFilter === f.key
                    ? 'bg-primary text-on-primary shadow-ambient'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
