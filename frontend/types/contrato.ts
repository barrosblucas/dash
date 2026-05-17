/**
 * Tipos para Gestao de Contratos
 * Portal da Transparencia - Bandeirantes MS
 */

export interface ContratoItem {
  numero: string;
  fornecedor: string;
  cpf_cnpj: string;
  tipo: string;
  vigencia: string;
  valor: number;
  ano: number;
}

export interface ContratoResumoAnual {
  ano: number;
  quantidade_contratos: number;
  total_valor: number;
  quantidade_principais: number;
  quantidade_aditivos: number;
}

export interface ContratoListResponse {
  items: ContratoItem[];
  quantidade: number;
  resumo: ContratoResumoAnual;
}

export interface ContratoFiscal {
  nome: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
}

export interface ContratoDetalhe {
  numero: string;
  fornecedor: string;
  cpf_cnpj: string;
  tipo: string;
  vigencia: string;
  valor: number;
  objeto: string;
  processo_numero: string;
  licitacao: string;
  assunto: string;
  qtd_aditivos: number;
  valor_contratado: number;
  valor_atualizado: number;
  saldo_pagar: number;
  valor_anulado: number;
  dotacoes_orcamentarias: string;
  fiscais: ContratoFiscal[];
  ano: number;
}
