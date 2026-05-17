/**
 * Tipos para Diárias e Passagens
 * Portal da Transparência - Bandeirantes MS
 */

export interface DiariaItem {
  numero_empenho: number;
  numero_liquidacao: number;
  nome: string;
  historico: string;
  destino: string;
  periodo: string;
  valor_total: number;
  valor_devolvido: number;
  ano: number;
  mes: number;
}

export interface DiariaResumoMensal {
  mes: number;
  total_valor: number;
  quantidade: number;
}

export interface DiariaResumoAnual {
  ano: number;
  quantidade_total: number;
  total_valor: number;
  total_devolvido: number;
  evolucao_mensal: DiariaResumoMensal[];
}

export interface DiariaListResponse {
  items: DiariaItem[];
  quantidade: number;
  resumo: DiariaResumoAnual;
}
