import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';

export interface DashboardData {
  receitas_totais: number;
  despesas_totais: number;
  saldo: number;
  ano_base: number;
}

export default function useDashboardData(ano?: number) {
  const year = ano || new Date().getFullYear();
  
  return useQuery<DashboardData>({
    queryKey: QUERY_KEYS.dashboard.summary(),
    queryFn: async () => {
      // TODO: Integrar com API
      // const response = await fetch(`${API_ENDPOINTS.base}${API_ENDPOINTS.dashboard.summary}`);
      // return response.json();
      
      // Dados mock para desenvolvimento
      return {
        receitas_totais: 125000000,
        despesas_totais: 118000000,
        saldo: 7000000,
        ano_base: year,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  });
}