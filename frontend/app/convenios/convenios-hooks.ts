'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conveniosService } from '@/services/convenio-service';

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from(
  { length: CURRENT_YEAR - 2020 + 2 },
  (_, i) => 2020 + i,
);
export const MONTHS = [
  { value: 0, label: 'Todos os meses' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
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

export const TIPO_FILTERS = [
  { key: undefined as string | undefined, label: 'Todos' },
  { key: 'Concedido', label: 'Concedido' },
  { key: 'Recebido', label: 'Recebido' },
] as const;

export const ESFERA_FILTERS = [
  { key: undefined as string | undefined, label: 'Todas' },
  { key: 'Municipal', label: 'Municipal' },
  { key: 'Estadual', label: 'Estadual' },
  { key: 'Federal', label: 'Federal' },
] as const;

export type SortField =
  | 'numero'
  | 'tipo'
  | 'esfera'
  | 'concedente'
  | 'convenente'
  | 'situacao'
  | 'valor';
export type SortDir = 'asc' | 'desc';

export function useConveniosData() {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [tipoFilter, setTipoFilter] = useState<string | undefined>(undefined);
  const [esferaFilter, setEsferaFilter] = useState<string | undefined>(
    undefined,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedNumero, setExpandedNumero] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'convenios' | 'movimentacoes'>(
    'convenios',
  );
  const [selectedMes, setSelectedMes] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['convenios', 'busca', ano, tipoFilter],
    queryFn: () => conveniosService.list(ano, tipoFilter),
    enabled: !!ano,
    staleTime: 5 * 60 * 1000,
  });

  const { data: movData, isLoading: movLoading } = useQuery({
    queryKey: ['convenios', 'movimentacoes', ano, selectedMes, tipoFilter],
    queryFn: () =>
      conveniosService.movimentacoes(ano, selectedMes || undefined, tipoFilter),
    enabled: activeTab === 'movimentacoes' && !!ano,
    staleTime: 5 * 60 * 1000,
  });

  const resumo = data?.resumo;

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (esferaFilter) {
      items = items.filter((i) => i.esfera === esferaFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.numero.toLowerCase().includes(lower) ||
          i.concedente.toLowerCase().includes(lower) ||
          i.convenente.toLowerCase().includes(lower) ||
          i.objeto.toLowerCase().includes(lower),
      );
    }
    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'valor') return mult * (a.valor - b.valor);
      if (sortField === 'numero')
        return mult * a.numero.localeCompare(b.numero);
      if (sortField === 'tipo') return mult * a.tipo.localeCompare(b.tipo);
      if (sortField === 'esfera') return mult * a.esfera.localeCompare(b.esfera);
      if (sortField === 'concedente')
        return mult * a.concedente.localeCompare(b.concedente);
      if (sortField === 'convenente')
        return mult * a.convenente.localeCompare(b.convenente);
      return mult * a.situacao.localeCompare(b.situacao);
    });
  }, [data?.items, esferaFilter, searchTerm, sortField, sortDir]);

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

  const toggleExpand = useCallback((numero: string) => {
    setExpandedNumero((prev) => (prev === numero ? null : numero));
  }, []);

  return {
    ano,
    setAno,
    tipoFilter,
    setTipoFilter,
    esferaFilter,
    setEsferaFilter,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    expandedNumero,
    activeTab,
    setActiveTab,
    selectedMes,
    setSelectedMes,
    data,
    isLoading,
    isError,
    error,
    movData,
    movLoading,
    filteredItems,
    resumo,
    handleSort,
    toggleExpand,
  };
}
