/**
 * Tipos para Controle Patrimonial
 * Portal da Transparencia - Bandeirantes MS
 */

export interface PatrimonioItem {
  tipo_bem: string;
  descricao: string;
  quantidade_anterior: number;
  valor_anterior: number;
  quantidade_adquiridos: number;
  valor_adquiridos: number;
  quantidade_baixados: number;
  valor_baixados: number;
  quantidade_atual: number;
  valor_atual: number;
  ano: number;
}

export interface PatrimonioResumoAnual {
  ano: number;
  total_bens: number;
  total_valor: number;
  por_tipo: Record<string, Record<string, number>>;
}

export interface PatrimonioListResponse {
  items: PatrimonioItem[];
  quantidade: number;
  resumo: PatrimonioResumoAnual;
}
