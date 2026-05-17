'use client';

import { motion } from 'framer-motion';

import { MESES, MESES_ABREV } from '@/lib/constants';
import type { FolhaOfficeItem } from '@/types/folha';

interface FolhaFiltersProps {
  anosDisponiveis: number[];
  ano: number;
  mes: number;
  onYearChange: (ano: number) => void;
  onMonthChange: (mes: number) => void;
  offices: FolhaOfficeItem[];
  officesLoading: boolean;
  selectedOfficeId: number;
  onOfficeChange: (officeId: number) => void;
  selectedDepartmentId: number;
  onDepartmentChange: (departmentId: number) => void;
  departments: FolhaOfficeItem[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchClear: () => void;
}

export function FolhaFilters({
  anosDisponiveis,
  ano,
  mes,
  onYearChange,
  onMonthChange,
  offices,
  officesLoading,
  selectedOfficeId,
  onOfficeChange,
  selectedDepartmentId,
  onDepartmentChange,
  departments,
  searchTerm,
  onSearchChange,
  onSearchClear,
}: FolhaFiltersProps) {
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
            calendar_month
          </span>
          <select
            value={ano}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          >
            {anosDisponiveis.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            date_range
          </span>
          <select
            value={mes}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          >
            {MESES.map((nome, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {nome} ({MESES_ABREV[idx]})
              </option>
            ))}
          </select>
        </div>

        {/* Office selector */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            business
          </span>
          <select
            value={selectedOfficeId}
            onChange={(e) => onOfficeChange(Number(e.target.value))}
            disabled={officesLoading}
            className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all min-w-[180px]"
          >
            <option value={0}>Todos os orgaos</option>
            {offices
              .filter(
                (o, i, arr) => arr.findIndex((x) => x.office_id === o.office_id) === i,
              )
              .sort((a, b) => a.office_description.localeCompare(b.office_description))
              .map((o) => (
                <option key={o.office_id} value={o.office_id}>
                  {o.office_description}
                </option>
              ))}
          </select>
        </div>

        {/* Department selector — only when an office is selected */}
        {selectedOfficeId !== 0 && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              account_tree
            </span>
            <select
              value={selectedDepartmentId}
              onChange={(e) => onDepartmentChange(Number(e.target.value))}
              className="bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all min-w-[180px]"
            >
              <option value={0}>Todos os departamentos</option>
              {departments
                .filter((d) => d.department_id !== null)
                .filter(
                  (d, i, arr) =>
                    arr.findIndex((x) => x.department_id === d.department_id) === i,
                )
                .sort((a, b) =>
                  (a.department_description ?? '').localeCompare(
                    b.department_description ?? '',
                  ),
                )
                .map((d) => (
                  <option key={d.department_id} value={d.department_id!}>
                    {d.department_description}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Search input */}
      <div className="relative mt-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar por nome, matricula, CPF ou cargo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface-container-high rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={onSearchClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
