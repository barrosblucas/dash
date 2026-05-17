'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from '@/lib/utils';
import { cargosService } from '@/services/cargo-service';
import type { CargoItem, CargoResumoCategoria, CargoListResponse } from '@/types/cargo';

/* ── Constants ── */

export const CURRENT_YEAR = new Date().getFullYear();

export const CATEGORIA_FILTERS = [
  { key: undefined as string | undefined, label: 'Todos' },
  { key: 'EFETIVO', label: 'Efetivo' },
  { key: 'CONTRATADOS', label: 'Contratados' },
  { key: 'COMISSIONADO', label: 'Comissionado' },
  { key: 'CONVOCADOS', label: 'Convocados' },
  { key: 'ELETIVO', label: 'Eletivo' },
] as const;

/* ── Types ── */

export type SortField = keyof CargoItem;
export type SortDir = 'asc' | 'desc';

export interface CargosData {
  ano: number;
  setAno: (v: number) => void;
  categoriaFilter: string | undefined;
  setCategoriaFilter: (v: string | undefined) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  expandedCargo: string | null;
  expandedCategoria: Record<string, boolean>;

  anosDisponiveis: number[] | undefined;
  data: CargoListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  resumo: CargoListResponse['resumo'] | undefined;
  filteredItems: CargoItem[];
  groupedByCategoria: Record<string, CargoItem[]>;
  categoriasOrdenadas: string[];
  salarioBaseMedio: number;

  handleSort: (field: SortField) => void;
  toggleExpand: (cargo: string) => void;
  toggleCategoriaExpand: (categoria: string) => void;
  getCategoriaResumo: (categoria: string) => CargoResumoCategoria | undefined;
  getCategoriaIcon: (categoria: string) => string;
  getCategoriaColor: (categoria: string) => string;
}

/* ── Hook ── */

export function useCargosData(): CargosData {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [categoriaFilter, setCategoriaFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('cargo');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);
  const [expandedCategoria, setExpandedCategoria] = useState<Record<string, boolean>>({});

  const { data: anosDisponiveis } = useQuery({
    queryKey: ['cargos', 'anos'],
    queryFn: () => cargosService.anos(),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cargos', 'busca', ano, categoriaFilter],
    queryFn: () => cargosService.list(ano, categoriaFilter),
    enabled: !!ano,
    staleTime: 5 * 60 * 1000,
  });

  const resumo = data?.resumo;

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.cargo.toLowerCase().includes(lower) ||
          i.categoria.toLowerCase().includes(lower)
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return mult * aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return mult * (aVal - bVal);
      }
      return 0;
    });
  }, [data?.items, searchTerm, sortField, sortDir]);

  const groupedByCategoria = useMemo(() => {
    return groupBy(filteredItems, 'categoria');
  }, [filteredItems]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const toggleExpand = useCallback((cargo: string) => {
    setExpandedCargo((prev) => (prev === cargo ? null : cargo));
  }, []);

  const toggleCategoriaExpand = useCallback((categoria: string) => {
    setExpandedCategoria((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  }, []);

  const categoriasOrdenadas = useMemo(() => {
    return Object.keys(groupedByCategoria).sort();
  }, [groupedByCategoria]);

  const getCategoriaResumo = useCallback(
    (categoria: string): CargoResumoCategoria | undefined => {
      return resumo?.categorias.find((c) => c.categoria === categoria);
    },
    [resumo?.categorias]
  );

  const getCategoriaIcon = (categoria: string): string => {
    const map: Record<string, string> = {
      EFETIVO: 'badge',
      CONTRATADOS: 'handshake',
      COMISSIONADO: 'supervisor_account',
      CONVOCADOS: 'group_add',
      ELETIVO: 'how_to_vote',
    };
    return map[categoria] || 'work';
  };

  const getCategoriaColor = (categoria: string): string => {
    const map: Record<string, { bg: string; text: string }> = {
      EFETIVO: { bg: 'bg-[#22c55e18]', text: 'text-[#22c55e]' },
      CONTRATADOS: { bg: 'bg-[#06b6d418]', text: 'text-[#06b6d4]' },
      COMISSIONADO: { bg: 'bg-[#a855f718]', text: 'text-[#a855f7]' },
      CONVOCADOS: { bg: 'bg-[#f9731618]', text: 'text-[#f97316]' },
      ELETIVO: { bg: 'bg-[#f43f5e18]', text: 'text-[#f43f5e]' },
    };
    const colors = map[categoria];
    return colors ? `${colors.bg} ${colors.text}` : 'bg-[#6366f118] text-[#6366f1]';
  };

  const salarioBaseMedio = resumo
    ? resumo.quantidade_cargos > 0
      ? resumo.total_salario_base / resumo.quantidade_cargos
      : 0
    : 0;

  return {
    ano,
    setAno,
    categoriaFilter,
    setCategoriaFilter,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    expandedCargo,
    expandedCategoria,
    anosDisponiveis,
    data,
    isLoading,
    isError,
    error,
    resumo,
    filteredItems,
    groupedByCategoria,
    categoriasOrdenadas,
    salarioBaseMedio,
    handleSort,
    toggleExpand,
    toggleCategoriaExpand,
    getCategoriaResumo,
    getCategoriaIcon,
    getCategoriaColor,
  };
}
