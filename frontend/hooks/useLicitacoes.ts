/**
 * Hooks para Licitações (ComprasBR + Quality Dispensas)
 * Portal da Transparência - Bandeirantes MS
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { licitacoesApi } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { LicitacaoComprasBRResponse, LicitacaoComprasBRDetail, DispensasLicitacaoResponse } from '@/types/licitacao';

export function useLicitacoesComprasBR(
  page: number = 1,
  size: number = 100,
  options?: Omit<UseQueryOptions<LicitacaoComprasBRResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<LicitacaoComprasBRResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.licitacoes.comprasbr(page, size),
    queryFn: () => licitacoesApi.comprasbr({ page, size }),
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
}

export function useLicitacaoComprasBRDetail(
  id: number | null,
  options?: Omit<UseQueryOptions<LicitacaoComprasBRDetail>, 'queryKey' | 'queryFn'>
): UseQueryResult<LicitacaoComprasBRDetail> {
  return useQuery({
    queryKey: QUERY_KEYS.licitacoes.comprasbrDetail(id ?? 0),
    queryFn: () => licitacoesApi.comprasbrDetail(id!),
    staleTime: 10 * 60 * 1000,
    enabled: id !== null && id !== undefined,
    ...options,
  });
}

export function useLicitacoesDispensas(
  options?: Omit<UseQueryOptions<DispensasLicitacaoResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<DispensasLicitacaoResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.licitacoes.dispensas(),
    queryFn: () => licitacoesApi.dispensas(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
