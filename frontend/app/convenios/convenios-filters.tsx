'use client';

import { motion } from 'framer-motion';

import {
  CURRENT_YEAR,
  YEARS,
  TIPO_FILTERS,
  ESFERA_FILTERS,
  MONTHS,
} from './convenios-hooks';

/* ── Tab Switcher ── */

interface ConveniosTabsProps {
  activeTab: 'convenios' | 'movimentacoes';
  onTabChange: (tab: 'convenios' | 'movimentacoes') => void;
}

export function ConveniosTabs({ activeTab, onTabChange }: ConveniosTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 shadow-ambient w-fit"
    >
      <button
        onClick={() => onTabChange('convenios')}
        className={`rounded-lg px-4 py-2 text-label-md font-medium transition-all duration-200 ${
          activeTab === 'convenios'
            ? 'bg-primary text-on-primary shadow-ambient'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        Convenios
      </button>
      <button
        onClick={() => onTabChange('movimentacoes')}
        className={`rounded-lg px-4 py-2 text-label-md font-medium transition-all duration-200 ${
          activeTab === 'movimentacoes'
            ? 'bg-primary text-on-primary shadow-ambient'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        Movimentacoes
      </button>
    </motion.div>
  );
}

/* ── Year / Tipo / Esfera Filter Bar ── */

interface FilterBarProps {
  ano: number;
  onAnoChange: (v: number) => void;
  tipoFilter: string | undefined;
  onTipoFilterChange: (v: string | undefined) => void;
  esferaFilter: string | undefined;
  onEsferaFilterChange: (v: string | undefined) => void;
}

export function FilterBar({
  ano,
  onAnoChange,
  tipoFilter,
  onTipoFilterChange,
  esferaFilter,
  onEsferaFilterChange,
}: FilterBarProps) {
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
          {TIPO_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => onTipoFilterChange(f.key)}
              className={`rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200 ${
                tipoFilter === f.key
                  ? 'bg-primary text-on-primary shadow-ambient'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Esfera filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {ESFERA_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => onEsferaFilterChange(f.key)}
              className={`rounded-full px-4 py-2 text-label-md font-medium transition-all duration-200 ${
                esferaFilter === f.key
                  ? 'bg-secondary text-on-secondary shadow-ambient'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Search Input ── */

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative mb-4">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
        search
      </span>
      <input
        type="text"
        placeholder="Buscar por numero, concedente, convenente ou objeto..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-high rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

/* ── Month Selector (Movimentacoes) ── */

interface MonthSelectorProps {
  selectedMes: number;
  onChange: (v: number) => void;
  count?: number;
}

export function MonthSelector({
  selectedMes,
  onChange,
  count,
}: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
        calendar_month
      </span>
      <select
        value={selectedMes}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <span className="text-label-md text-on-surface-variant">
        {count !== undefined ? `(${count} registros)` : ''}
      </span>
    </div>
  );
}
