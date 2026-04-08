import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import type { ReceitaFiltro, ReceitaAgregada } from '@/types';

export default function useRevenueData(filtros?: ReceitaFiltro) {
  return useQuery<ReceitaAgregada[]>({
    queryKey: QUERY_KEYS.receitas.aggregated(filtros ? (filtros as Record<string, unknown>) : {}),
    queryFn: async () => {
      // TODO: Integrar com API
      // const params = new URLSearchParams(filtros as Record<string, string>);
      // const response = await fetch(`${API_ENDPOINTS.base}${API_ENDPOINTS.receitas.aggregated}?${params}`);
      // return response.json();
      
      // Dados mock para desenvolvimento
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!filtros,
  });
}