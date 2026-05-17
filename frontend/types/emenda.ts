/**
 * Tipos para Emendas Parlamentares
 * Portal da Transparencia - Bandeirantes MS
 */

export interface EmendaItem {
  emenda: string;
  tipo_emenda: string;
  numero_protocolo: string;
  descricao: string;
  valor: number;
  ano: number;
}

export interface EmendaResumoAnual {
  ano: number;
  quantidade_emendas: number;
  total_valor: number;
  por_tipo: Record<string, number>;
}

export interface EmendaListResponse {
  items: EmendaItem[];
  quantidade: number;
  resumo: EmendaResumoAnual;
}
