'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { folhaService } from '@/services/folha-service';
import type {
  FolhaEmployeeItem,
  FolhaOfficeItem,
  FolhaOfficeAggregated,
  FolhaEmployeeListResponse,
} from '@/types/folha';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({ length: CURRENT_YEAR - 2020 + 2 }, (_, i) => 2020 + i);

export type SortField =
  | 'contract'
  | 'name'
  | 'cpf'
  | 'role'
  | 'office_description'
  | 'gross_salary'
  | 'net_salary';
export type SortDir = 'asc' | 'desc';

export interface FolhaDataReturn {
  ano: number;
  mes: number;
  selectedOfficeId: number;
  selectedDepartmentId: number;
  setSelectedDepartmentId: (v: number) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  expandedContract: string | null;
  showAggregated: boolean;
  setShowAggregated: (v: boolean) => void;
  data: FolhaEmployeeListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  officesLoading: boolean;
  resumo: FolhaEmployeeListResponse['resumo'] | undefined;
  anosDisponiveis: number[];
  offices: FolhaOfficeItem[];
  departments: FolhaOfficeItem[];
  officeAggregated: FolhaOfficeAggregated[];
  filteredItems: FolhaEmployeeItem[];
  handleSort: (field: SortField) => void;
  toggleExpand: (contract: string) => void;
  onYearChange: (ano: number) => void;
  onMonthChange: (mes: number) => void;
  onOfficeChange: (officeId: number) => void;
}

export function useFolhaData(): FolhaDataReturn {
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState(CURRENT_MONTH);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number>(0);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [showAggregated, setShowAggregated] = useState(true);

  /* ── Queries ── */

  const { data: anosData } = useQuery({
    queryKey: ['folha', 'anos'],
    queryFn: () => folhaService.anos(),
    staleTime: 30 * 60 * 1000,
  });

  const anosDisponiveis = useMemo(() => {
    if (anosData?.length) return anosData;
    return YEARS;
  }, [anosData]);

  const { data: officesData, isLoading: officesLoading } = useQuery({
    queryKey: ['folha', 'offices', ano, mes],
    queryFn: () => folhaService.offices(ano, mes),
    enabled: !!ano && !!mes,
    staleTime: 5 * 60 * 1000,
  });

  const offices = useMemo(() => officesData?.items ?? [], [officesData]);

  const departments = useMemo(() => {
    if (selectedOfficeId === 0) return offices;
    return offices.filter((o) => o.office_id === selectedOfficeId);
  }, [offices, selectedOfficeId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'folha',
      'employees',
      ano,
      mes,
      selectedOfficeId,
      selectedDepartmentId,
      searchTerm,
    ],
    queryFn: () =>
      folhaService.employees(
        ano,
        mes,
        selectedOfficeId !== 0 ? selectedOfficeId : undefined,
        selectedDepartmentId !== 0 ? selectedDepartmentId : undefined,
        searchTerm || undefined,
      ),
    enabled: !!ano && !!mes,
    staleTime: 5 * 60 * 1000,
  });

  const resumo = data?.resumo;

  /* ── Aggregated by office ── */

  const officeAggregated = useMemo(() => {
    if (!data?.items) return [];
    const map = new Map<number, FolhaOfficeAggregated>();
    data.items.forEach((emp) => {
      const key = emp.office_id;
      const existing = map.get(key);
      if (existing) {
        existing.quantidade_servidores += 1;
        existing.total_bruto += emp.gross_salary;
        existing.total_liquido += emp.net_salary;
        existing.total_descontos += emp.discounts;
      } else {
        map.set(key, {
          office_id: emp.office_id,
          office_description: emp.office_description,
          department_id: emp.department_id,
          department_description: emp.department_description,
          quantidade_servidores: 1,
          total_bruto: emp.gross_salary,
          total_liquido: emp.net_salary,
          total_descontos: emp.discounts,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.office_description.localeCompare(b.office_description),
    );
  }, [data?.items]);

  /* ── Filtered & sorted employees ── */

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;

    if (selectedOfficeId !== 0) {
      items = items.filter((i) => i.office_id === selectedOfficeId);
    }
    if (selectedDepartmentId !== 0) {
      items = items.filter((i) => i.department_id === selectedDepartmentId);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          i.contract.toLowerCase().includes(lower) ||
          i.cpf.toLowerCase().includes(lower) ||
          i.role.toLowerCase().includes(lower),
      );
    }

    return [...items].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'gross_salary' || sortField === 'net_salary') {
        return mult * (a[sortField] - b[sortField]);
      }
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      return mult * aVal.localeCompare(bVal, 'pt-BR');
    });
  }, [data?.items, selectedOfficeId, selectedDepartmentId, searchTerm, sortField, sortDir]);

  /* ── Handlers ── */

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

  const toggleExpand = useCallback((contract: string) => {
    setExpandedContract((prev) => (prev === contract ? null : contract));
  }, []);

  const onYearChange = useCallback((y: number) => {
    setAno(y);
    setSelectedOfficeId(0);
    setSelectedDepartmentId(0);
  }, []);

  const onMonthChange = useCallback((m: number) => {
    setMes(m);
    setSelectedOfficeId(0);
    setSelectedDepartmentId(0);
  }, []);

  const onOfficeChange = useCallback((oid: number) => {
    setSelectedOfficeId(oid);
    setSelectedDepartmentId(0);
  }, []);

  return {
    ano,
    mes,
    selectedOfficeId,
    selectedDepartmentId,
    setSelectedDepartmentId,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    expandedContract,
    showAggregated,
    setShowAggregated,
    data,
    isLoading,
    isError,
    error,
    officesLoading,
    resumo,
    anosDisponiveis,
    offices,
    departments,
    officeAggregated,
    filteredItems,
    handleSort,
    toggleExpand,
    onYearChange,
    onMonthChange,
    onOfficeChange,
  };
}
