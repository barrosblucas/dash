/**
 * Tipos para Despesas Municipais
 * Dashboard Financeiro - Bandeirantes MS
 */

// Categoria de despesa segundo a portaria STN
export type DespesaCategoria =
  | 'despesas_correntes'
  | 'despesas_de_capital'
  | 'despesas_intra_orcamentarias';

// Natureza da despesa (elemento)
export type DespesaNatureza =
  | 'pessoal_encargos'
  | 'juros_encargos_divida'
  | 'outras_despesas_correntes'
  | 'investimentos'
  | 'inversoes_financeiras'
  | 'amortizacao_divida'
  | 'reserva_contingencia';

// Modalidade de aplicação
export type DespesaModalidade =
  | 'grafica_direta'
  | 'transferencias'
  | 'aplicacao_direta'
  | 'outras';

// Função de governo
export type DespesaFuncao =
  | 'administracao'
  | 'agricultura'
  | 'assistencia_social'
  | 'comunicacoes'
  | 'cultura'
  | 'defesa_nacional'
  | 'desporto_lazer'
  | 'direitos_cidadania'
  | 'educacao'
  | 'encargos_especiais'
  | 'energia'
  | 'gestao_ambiental'
  | 'habitacao'
  | 'industria'
  | 'judiciaria'
  | 'legislativa'
  | 'saude'
  | 'seguranca_publica'
  | 'trabalho'
  | 'transporte'
  | 'urbanismo'
  | 'outras';

// Subfunção específica
export type DespesaSubfuncao = string; // Muitas subfunções específicas

// Estrutura de uma despesa individual
export interface Despesa {
  id: string;
  ano: number;
  mes: number;
  data: Date;
  
  // Classificação institucional
  unidade_gestora: string;
  orgao: string;
  unidade: string;
  
  // Classificação funcional
  funcao: DespesaFuncao;
  subfuncao: string;
  programa: string;
  acao: string;
  
  // Classificação econômica
  categoria: DespesaCategoria;
  natureza: DespesaNatureza;
  modalidade: DespesaModalidade;
  elemento: string;
  
  // Valores
  valor_orcado: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  
  // Identificação
  numero_empenho?: string;
  credor?: string;
  cnpj_credor?: string;
  historico?: string;
  notas?: string;
  
  // Computed
  percentual_execucao?: number;
  saldo_orcamentario?: number;
}

// Dados agregados por período
export interface DespesaAgregada {
  periodo: Date;
  ano: number;
  mes?: number;
  trimestre?: number;
  semestre?: number;
  
  // Totais
  total_orcado: number;
  total_empenhado: number;
  total_liquidado: number;
  total_pago: number;
  
  // Por categoria
  despesas_correntes: number;
  despesas_capital: number;
  
  // Por função principal
  educacao: number;
  saude: number;
  administracao: number;
  outras: number;
  
  // Métricas
  taxa_execucao: number;
  variacao_mes_anterior?: number;
  variacao_ano_anterior?: number;
}

// Dados para gráficos temporais
export interface DespesaTimeline {
  data: Date;
  valor: number;
  tipo: 'orcado' | 'empenhado' | 'liquidado' | 'pago' | 'forecast';
  intervalo_inferior?: number;
  intervalo_superior?: number;
}

// Dados para Sankey (fluxo orçamento → execução)
export interface DespesaFlow {
  source: string;
  target: string;
  value: number;
  percentual: number;
}

// Comparativo orçamento x execução
export interface DespesaExecucao {
  funcao: DespesaFuncao;
  orcado: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  taxa_execucao: number;
  saldo: number;
}

// Filtros de consulta
export interface DespesaFiltro {
  ano_inicio?: number;
  ano_fim?: number;
  mes_inicio?: number;
  mes_fim?: number;
  categorias?: DespesaCategoria[];
  naturezas?: DespesaNatureza[];
  funcoes?: DespesaFuncao[];
  unidades?: string[];
  credores?: string[];
}

// KPIs de despesa
export interface DespesaKPI {
  total_orcado: number;
  total_pago: number;
  taxa_execucao: number;
  variacao_ano_anterior: number;
  
  // Maiores funções
  top_funcoes: Array<{
    funcao: DespesaFuncao;
    valor: number;
    percentual: number;
  }>;
  
  // Composição
  pessoal_percentual: number;
  investimentos_percentual: number;
  servicos_percentual: number;
  
  // Previsão
  forecast_proximo_mes: number;
  forecast_fim_ano: number;
  
  // Alertas
  alertas: Array<{
    tipo: 'alta' | 'media' | 'baixa';
    mensagem: string;
    valor?: number;
  }>;
}

// Dados para heatmap de sazonalidade
export interface DespesaSazonalidade {
  mes: number;
  ano: number;
  valor: number;
  percentual_anual: number;
  variacao_media: number;
}

// Análise por credor
export interface DespesaCredor {
  nome: string;
  cnpj?: string;
  valor_total: number;
  quantidade_empenhos: number;
  percentual_total: number;
  funcoes_principais: DespesaFuncao[];
}