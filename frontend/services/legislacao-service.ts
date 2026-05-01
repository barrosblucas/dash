/**
 * Serviço de Legislações
 * Dashboard Financeiro - Bandeirantes MS
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/lib/constants';
import type { LegislacaoListResponse, LegislacaoDetalhe, LegislacaoFilters } from '@/types/legislacao';

export const legislacaoService = {
  list: async (filters: LegislacaoFilters = {}): Promise<LegislacaoListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.size) params.set('size', String(filters.size));
    if (filters.tipo) params.set('tipo', filters.tipo);
    if (filters.ano) params.set('ano', String(filters.ano));
    if (filters.status) params.set('status', filters.status);
    if (filters.busca) params.set('busca', filters.busca);

    const query = params.toString();
    const url = `${API_ENDPOINTS.legislacao.list}${query ? `?${query}` : ''}`;
    return apiClient.get<LegislacaoListResponse>(url);
  },

  getById: async (id: string): Promise<LegislacaoDetalhe> => {
    return apiClient.get<LegislacaoDetalhe>(API_ENDPOINTS.legislacao.detail(id));
  },
};
