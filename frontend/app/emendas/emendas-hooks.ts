'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emendasService } from '@/services/emenda-service';
import type { EmendaItem, EmendaListResponse, EmendaResumoAnual } from '@/types/emenda';

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 2 }, (_, i) => 2020 + i);

export type SortField = 'emenda' | 'tipo_emenda' | 'numero_protocolo' | 'valor';
export type SortDir = 'asc' | 'desc';

const tipoPalette = [
  { bg: '#22c55e18', text: '#22c55e' },
  { bg: '#06b6d418', text: '#06b6d4' },
  { bg: '#a855f718', text: '#a855f7' },
  { bg: '#f9731618', text: '#f97316' },
  { bg: '#f43f5e18', text: '#f43f5e' },
  { bg: '#3b82f618', text: '#3b82f6' },
  { bg: '#f59e0b18', text: '#f59e0b' },
  { bg: '#10b98118', text: '#10b981' },
  { bg: '#6366f118', text: '#6366f1' },
  { bg: '#ec489918', text: '#ec4899' },
];

function hashTipo(tipo: string): number {
  let hash = 0;
  for (let i = 0; i < tipo.length; i++) {
    hash = ((hash << 5) - hash + tipo.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % tipoPalette.length;
}

export function tipoColor(tipo: string): string {
  return tipoPalette[hashTipo(tipo)].text;
}

export function tipoBg(tipo: string): string {
  return tipoPalette[hashTipo(tipo)].bg;
}

export interface UseEmendasReturn {
  ano: number;
  setAno: (value: number) => void;
  tipoFilter: string | undefined;
  setTipoFilter: (value: string | undefined) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  clearSearch: () => void;
  sortField: SortField;
  sortDir: SortDir;
  handleSort: (field: SortField) => void;
  expandedEmenda: string | null;
  toggleExpand: (emenda: string) => void;
  data: EmendaListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  resumo: EmendaResumoAnual | undefined;
  availableTipos: string[];
  filteredItems: EmendaItem[];
}

export function useEmendas(): UseEmendasReturn {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedEmenda, setExpandedEmenda] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['emendas', 'busca', ano, tipoFilter],
    queryFn: () => emendasService.list(ano, tipoFilter),
    enabled: !!ano,
    staleTime: 5 * 60 * 1000,
  });

  const resumo = data?.resumo;

  const availableTipos = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set(data.items.map((i) => i.tipo_emenda));
    return Array.from(set).sort();
  }, [data?.items]);

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.emenda.toLowerCase().includes(lower) ||
          i.numero_protocolo.toLowerCase().includes(lower) ||
          i.descricao.toLowerCase().includes(lower),
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'valor') return mult * (a.valor - b.valor);
      if (sortField === 'emenda') return mult * a.emenda.localeCompare(b.emenda);
      if (sortField === 'tipo_emenda') return mult * a.tipo_emenda.localeCompare(b.tipo_emenda);
      if (sortField === 'numero_protocolo') return mult * a.numero_protocolo.localeCompare(b.numero_protocolo);
      return 0;
    });
  }, [data?.items, searchTerm, sortField, sortDir]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const toggleExpand = useCallback((emenda: string) => {
    setExpandedEmenda((prev) => (prev === emenda ? null : emenda));
  }, []);

  const clearSearch = useCallback(() => setSearchTerm(''), []);

  return {
    ano,
    setAno,
    tipoFilter,
    setTipoFilter,
    searchTerm,
    setSearchTerm,
    clearSearch,
    sortField,
    sortDir,
    handleSort,
    expandedEmenda,
    toggleExpand,
    data,
    isLoading,
    isError,
    error: error as Error | null,
    resumo,
    availableTipos,
    filteredItems,
  };
}
