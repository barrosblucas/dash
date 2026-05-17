'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patrimonioService } from '@/services/patrimonio-service';
import { groupBy } from '@/lib/utils';
import type { PatrimonioItem } from '@/types/patrimonio';

/* ── Constants ── */

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from(
  { length: CURRENT_YEAR - 2020 + 2 },
  (_, i) => 2020 + i,
);

export const TIPO_FILTERS = [
  { key: undefined as string | undefined, label: 'Todos' },
  { key: 'Móvel', label: 'Móvel' },
  { key: 'Imóvel', label: 'Imóvel' },
  { key: 'Veículo', label: 'Veículo' },
] as const;

export const TIPO_COLORS: Record<string, { bg: string; text: string }> = {
  Móvel: { bg: '#22c55e18', text: '#22c55e' },
  Imóvel: { bg: '#06b6d418', text: '#06b6d4' },
  Veículo: { bg: '#a855f718', text: '#a855f7' },
};

export const TIPO_ORDER = ['Móvel', 'Imóvel', 'Veículo'];

/* ── Types ── */

export type SortField =
  | 'descricao'
  | 'tipo_bem'
  | 'quantidade_anterior'
  | 'valor_anterior'
  | 'quantidade_adquiridos'
  | 'valor_adquiridos'
  | 'quantidade_baixados'
  | 'valor_baixados'
  | 'quantidade_atual'
  | 'valor_atual';

export type SortDir = 'asc' | 'desc';

/* ── Hook ── */

export function usePatrimonioData() {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('descricao');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedDescricao, setExpandedDescricao] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patrimonio', 'busca', ano, tipoFilter],
    queryFn: () => patrimonioService.list(ano, tipoFilter),
    enabled: !!ano,
    staleTime: 5 * 60 * 1000,
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.descricao.toLowerCase().includes(lower) ||
          i.tipo_bem.toLowerCase().includes(lower),
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'descricao')
        return mult * a.descricao.localeCompare(b.descricao);
      if (sortField === 'tipo_bem')
        return mult * a.tipo_bem.localeCompare(b.tipo_bem);
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return mult * (aVal - bVal);
    });
  }, [data?.items, searchTerm, sortField, sortDir]);

  const groupedItems = useMemo(
    () => groupBy(filteredItems, 'tipo_bem'),
    [filteredItems],
  );

  const sortedGroups = useMemo(() => {
    return Object.entries(groupedItems).sort(
      ([a], [b]) => TIPO_ORDER.indexOf(a) - TIPO_ORDER.indexOf(b),
    );
  }, [groupedItems]);

  const totals = useMemo(
    () => ({
      totalBens: filteredItems.reduce((s, i) => s + i.quantidade_atual, 0),
      totalValor: filteredItems.reduce((s, i) => s + i.valor_atual, 0),
      totalAdquiridos: filteredItems.reduce(
        (s, i) => s + i.quantidade_adquiridos,
        0,
      ),
      totalBaixados: filteredItems.reduce(
        (s, i) => s + i.quantidade_baixados,
        0,
      ),
    }),
    [filteredItems],
  );

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

  const toggleExpand = useCallback((descricao: string) => {
    setExpandedDescricao((prev) => (prev === descricao ? null : descricao));
  }, []);

  return {
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
  };
}
