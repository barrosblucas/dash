/**
 * Tipos para Gestao de Convenios
 * Portal da Transparencia - Bandeirantes MS
 */

export interface ConvenioItem {
  numero: string;
  assinatura: string;
  tipo: string; // Concedido, Recebido
  esfera: string; // Municipal, Estadual, Federal
  concedente: string;
  convenente: string;
  valor: number;
  situacao: string;
  objeto: string;
  ano: number;
}

export interface ConvenioMovimentacao {
  convenio: string;
  lancamento: string;
  entidade: string;
  data: string;
  concedente: string;
  convenente: string;
  valor: number;
  mes: number;
  tipo: 'receita' | 'despesa';
}

export interface ConvenioResumoAnual {
  ano: number;
  quantidade_convenios: number;
  total_valor: number;
  total_receitas: number;
  total_despesas: number;
}

export interface ConvenioListResponse {
  items: ConvenioItem[];
  quantidade: number;
  resumo: ConvenioResumoAnual;
}

export interface ConvenioMovimentacaoResponse {
  items: ConvenioMovimentacao[];
  quantidade: number;
}
