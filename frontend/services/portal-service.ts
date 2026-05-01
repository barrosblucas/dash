/**
 * Serviço de dados do Portal Público
 *
 * Centraliza as chamadas de API para o Painel de Informações Rápidas
 * e outros dados dinâmicos do portal público.
 */
import { apiClient } from '@/services/api';
import type { ObraRecord } from '@/types/obra';
import type { LicitacaoComprasBR } from '@/types/licitacao';
import type { NoticiaResponse } from '@/types/noticias';

/**
 * Busca a obra em destaque (mais recentemente atualizada).
 */
export async function fetchObraDestaque(): Promise<ObraRecord> {
  return apiClient.get<ObraRecord>('/api/v1/obras/destaque');
}

/**
 * Busca a próxima licitação com data de abertura futura mais próxima.
 */
export async function fetchProximaLicitacao(): Promise<LicitacaoComprasBR> {
  return apiClient.get<LicitacaoComprasBR>('/api/v1/licitacoes/proxima');
}

/**
 * Busca a última notícia do município.
 */
export async function fetchUltimaNoticia(): Promise<NoticiaResponse> {
  return apiClient.get<NoticiaResponse>('/api/v1/noticias/ultima');
}

/**
 * Busca o total de receitas arrecadadas no ano mais recente.
 */
export async function fetchReceitasTotais(): Promise<{ receitas_total: number }> {
  return apiClient.get<{ receitas_total: number; despesas_total: number; saldo: number; periodo: string }>('/api/v1/kpis');
}
