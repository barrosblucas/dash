/**
 * Serviço de Legislações
 * Dashboard Financeiro - Bandeirantes MS
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '@/lib/constants';
import type { LegislacaoListResponse, LegislacaoDetalhe, LegislacaoFilters, LegislacaoCreatePayload, LegislacaoUpdatePayload } from '@/types/legislacao';

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

export const legislacaoAdminService = {
  list: async (): Promise<LegislacaoListResponse> => {
    return apiClient.get<LegislacaoListResponse>(API_ENDPOINTS.legislacao.list);
  },
  getById: async (id: string): Promise<LegislacaoDetalhe> => {
    return apiClient.get<LegislacaoDetalhe>(API_ENDPOINTS.legislacao.detail(id));
  },
  create: async (payload: LegislacaoCreatePayload): Promise<LegislacaoDetalhe> => {
    return apiClient.post<LegislacaoDetalhe>(API_ENDPOINTS.legislacao.list, payload);
  },
  update: async (id: string, payload: LegislacaoUpdatePayload): Promise<LegislacaoDetalhe> => {
    return apiClient.put<LegislacaoDetalhe>(API_ENDPOINTS.legislacao.detail(id), payload);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.legislacao.detail(id));
  },
};
