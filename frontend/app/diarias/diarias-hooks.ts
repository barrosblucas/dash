'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { diariasService } from '@/services/diaria-service';

/* ── Constants ── */

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 2 }, (_, i) => 2020 + i);

export const MONTHS = [
  { value: undefined as number | undefined, label: 'Todos os meses' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export const MES_LABELS = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/* ── Types ── */

export type SortField = 'nome' | 'destino' | 'valor_total' | 'valor_devolvido' | 'periodo';
export type SortDir = 'asc' | 'desc';

export interface DiariaFilters {
  ano: number;
  mes: number | undefined;
  searchTerm: string;
  sortField: SortField;
  sortDir: SortDir;
  expandedIndex: number | null;
}

export interface DiariaHandlers {
  setAno: (ano: number) => void;
  setMes: (mes: number | undefined) => void;
  setSearchTerm: (term: string) => void;
  handleSort: (field: SortField) => void;
  toggleExpand: (index: number) => void;
}

export interface DiariaData {
  filters: DiariaFilters;
  handlers: DiariaHandlers;
  data: ReturnType<typeof useQuery>['data'];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  filteredItems: ReturnType<typeof useQuery>['data'] extends { items: infer T } ? T : never;
  maxMonthlyValue: number;
}

/* ── Hook ── */

export function useDiariasData() {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('valor_total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['diarias', 'busca', ano, mes],
    queryFn: () => diariasService.list(ano, mes),
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
          i.nome.toLowerCase().includes(lower) ||
          i.destino.toLowerCase().includes(lower) ||
          i.historico.toLowerCase().includes(lower)
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'valor_total') return mult * (a.valor_total - b.valor_total);
      if (sortField === 'valor_devolvido') return mult * (a.valor_devolvido - b.valor_devolvido);
      if (sortField === 'nome') return mult * a.nome.localeCompare(b.nome);
      if (sortField === 'destino') return mult * a.destino.localeCompare(b.destino);
      return mult * a.periodo.localeCompare(b.periodo);
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
    [sortField]
  );

  const toggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const maxMonthlyValue = useMemo(() => {
    if (!resumo?.evolucao_mensal?.length) return 1;
    return Math.max(...resumo.evolucao_mensal.map((m) => m.total_valor), 1);
  }, [resumo]);

  return {
    filters: { ano, mes, searchTerm, sortField, sortDir, expandedIndex },
    handlers: { setAno, setMes, setSearchTerm, handleSort, toggleExpand },
    data,
    isLoading,
    isError,
    error,
    filteredItems,
    resumo,
    maxMonthlyValue,
  };
}
