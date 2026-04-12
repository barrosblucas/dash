/**
 * Tipos para Receitas Municipais
 * Dashboard Financeiro - Bandeirantes MS
 */

// Categoria de receita segundo a portaria STN
export type ReceitaCategoria =
  | 'receitas_correntes'
  | 'receitas_de_capital'
  | 'receitas_intra_orcamentarias';

// Origem da receita (subcategoria)
export type ReceitaOrigem =
  | 'tributaria'
  | 'contribuicoes'
  | 'patrimonial'
  | 'agropecuaria'
  | 'industrial'
  | 'servicos'
  | 'transferencias_correntes'
  | 'outras_receitas_correntes'
  | 'alienacao_bens'
  | 'amortizacao_emprestimos'
  | 'transferencias_capital'
  | 'outras_receitas_capital';

// Fonte de recurso específica
export type ReceitaFonte =
  | 'fpm'
  | 'icms'
  | 'iptu'
  | 'iss'
  | 'itr'
  | 'ipva'
  | 'itcd'
  | 'itbi'
  | 'taxas'
  | 'contribuicoes'
  | 'transferencias_estaduais'
  | 'transferencias_federais'
  | 'outras';

// Estrutura de uma receita individual
export interface Receita {
  id: string;
  ano: number;
  mes: number;
  data: Date;
  
  // Classificação
  categoria: ReceitaCategoria;
  origem: ReceitaOrigem;
  fonte: ReceitaFonte;
  codigo: string; // Código contábil
  descricao: string;
  
  // Valores
  valor_previsto: number;
  valor_realizado: number;
  valor_liquidado?: number;
  
  // Metadados
  unidade_gestora: string;
  fonte_recurso: string;
  notas?: string;
  
  // Computed
  percentual_realizado?: number;
  variacao_anterior?: number;
}

// Dados agregados por período
export interface ReceitaAgregada {
  periodo: Date;
  ano: number;
  mes?: number;
  trimestre?: number;
  semestre?: number;
  
  // Totais
  total_previsto: number;
  total_realizado: number;
  total_liquidado: number;
  
  // Por categoria
  receitas_correntes: number;
  receitas_capital: number;
  
  // Por origem principal
  tributaria: number;
  transferencias: number;
  outras: number;
  
  // Métricas comparativas
  variacao_mes_anterior?: number;
  variacao_ano_anterior?: number;
  acumulado_ano?: number;
}

// Dados para gráficos temporais
export interface ReceitaTimeline {
  data: Date;
  valor: number;
  tipo: 'previsto' | 'realizado' | 'forecast';
  intervalo_inferior?: number;
  intervalo_superior?: number;
}

// Evolução comparativa
export interface ReceitaComparativa {
  ano_base: number;
  ano_comparacao: number;
  periodo: Date;
  valor_base: number;
  valor_comparacao: number;
  variacao_absoluta: number;
  variacao_percentual: number;
}

// Filtros de consulta
export interface ReceitaFiltro {
  ano_inicio?: number;
  ano_fim?: number;
  mes_inicio?: number;
  mes_fim?: number;
  categorias?: ReceitaCategoria[];
  origens?: ReceitaOrigem[];
  fontes?: ReceitaFonte[];
  unidades?: string[];
}

// KPIs de receita
export interface ReceitaKPI {
  total_realizado: number;
  total_previsto: number;
  percentual_realizacao: number;
  variacao_ano_anterior: number;
  variacao_percentual: number;
  
  // Maiores fontes
  top_fontes: Array<{
    fonte: ReceitaFonte;
    valor: number;
    percentual: number;
  }>;
  
  // Previsão
  forecast_proximo_mes: number;
  forecast_fim_ano: number;
  
  // Sazonalidade
  indice_sazonalidade: number;
}

// Composição percentual para Sankey
export interface ReceitaComposicao {
  id: string;
  origem: ReceitaOrigem;
  fonte: ReceitaFonte;
  valor: number;
  percentual: number;
  target?: string; // Para flow Sankey
}

// Detalhamento hierárquico de receita (extraído do PDF)
export interface ReceitaDetalhamento {
  id: number;
  ano: number;
  detalhamento: string;
  nivel: number;
  ordem: number;
  tipo: 'CORRENTE' | 'CAPITAL';
  valor_previsto: number;
  valor_arrecadado: number;
  valor_anulado: number;
  fonte: string;
}

// Resposta da API de detalhamento
export interface ReceitaDetalhamentoListResponse {
  ano: number;
  itens: ReceitaDetalhamento[];
  total_itens: number;
}