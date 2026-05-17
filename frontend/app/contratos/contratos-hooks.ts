'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { contratosService } from '@/services/contrato-service';

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 2 }, (_, i) => 2020 + i);

export const TIPO_FILTERS = [
  { key: undefined as string | undefined, label: 'Todos' },
  { key: 'Principal', label: 'Contrato Principal' },
  { key: 'Aditivo', label: 'Aditivo' },
] as const;

export type SortField = 'numero' | 'fornecedor' | 'cpf_cnpj' | 'tipo' | 'vigencia' | 'valor';
export type SortDir = 'asc' | 'desc';

export function useContratos() {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedNumero, setExpandedNumero] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['contratos', 'busca', ano, tipoFilter],
    queryFn: () => contratosService.list(ano, tipoFilter),
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
          i.numero.toLowerCase().includes(lower) ||
          i.fornecedor.toLowerCase().includes(lower) ||
          i.cpf_cnpj.toLowerCase().includes(lower)
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'valor') return mult * (a.valor - b.valor);
      if (sortField === 'numero') return mult * a.numero.localeCompare(b.numero);
      if (sortField === 'fornecedor') return mult * a.fornecedor.localeCompare(b.fornecedor);
      if (sortField === 'cpf_cnpj') return mult * a.cpf_cnpj.localeCompare(b.cpf_cnpj);
      if (sortField === 'tipo') return mult * a.tipo.localeCompare(b.tipo);
      return mult * a.vigencia.localeCompare(b.vigencia);
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

  const toggleExpand = useCallback((numero: string) => {
    setExpandedNumero((prev) => (prev === numero ? null : numero));
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
    handleSort,
    expandedNumero,
    toggleExpand,
    data,
    isLoading,
    isError,
    error,
    resumo,
    filteredItems,
  };
}
