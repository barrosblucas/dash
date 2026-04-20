/**
 * Hooks para Movimento Extra Orçamentário
 * Portal da Transparência - Bandeirantes MS
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { movimentoExtraApi } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { MovimentoExtraResponse, MovimentoTipo, MovimentoExtraAnualResponse } from '@/types/movimento-extra';

export function useMovimentoExtra(
  ano: number,
  mes: number,
  tipo: MovimentoTipo,
  options?: Omit<UseQueryOptions<MovimentoExtraResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<MovimentoExtraResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.movimentoExtra.busca(ano, mes, tipo),
    queryFn: () => movimentoExtraApi.busca({ ano, mes, tipo }),
    enabled: !!ano && !!mes,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}

export function useMovimentoExtraAnual(
  ano: number,
  options?: Omit<UseQueryOptions<MovimentoExtraAnualResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<MovimentoExtraAnualResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.movimentoExtra.anual(ano),
    queryFn: () => movimentoExtraApi.anual(ano),
    enabled: !!ano,
    staleTime: 10 * 60 * 1000, // 10 minutos — anual muda pouco
    ...options,
  });
}
