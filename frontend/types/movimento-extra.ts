/**
 * Tipos para Movimento Extra Orçamentário
 * Portal da Transparência - Bandeirantes MS
 */

export interface MovimentoExtraItem {
  codigo: number;
  ent_codigo: number;
  descricao: string;
  fornecedor: string;
  tipo: 'R' | 'D';
  valor_recebido: number;
  mes: number;
  ano: number;
}

export interface FundoResumo {
  fundo: string;
  descricao_completa: string;
  total_receitas: number;
  total_despesas: number;
  quantidade_itens: number;
}

export interface InsightItem {
  categoria: string;
  valor: number;
  percentual: number;
  quantidade: number;
  descricao: string;
}

export interface ResumoMensalItem {
  mes: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export interface MovimentoExtraResponse {
  items: MovimentoExtraItem[];
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  quantidade: number;
  fundos_resumo: FundoResumo[];
  insights_receitas: InsightItem[];
  insights_despesas: InsightItem[];
}

export interface MovimentoExtraAnualResponse {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  quantidade_total: number;
  insights_receitas: InsightItem[];
  insights_despesas: InsightItem[];
  evolucao_mensal: ResumoMensalItem[];
}

export type MovimentoTipo = 'R' | 'D' | 'AMBOS';

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

/**
 * Glossário completo de termos e fundos municipais.
 * Cada entrada explica o que o termo significa para o cidadão.
 */
export const GLOSSARIO_FUNDOS: Record<string, {
  nome: string;
  descricao: string;
  impacto_cidadao: string;
  cor: string;
}> = {
  FUNDEB: {
    nome: 'Fundo de Manutenção e Desenvolvimento da Educação Básica',
    descricao: 'Fundo que destina recursos para a educação básica municipal, incluindo salários de professores, manutenção de escolas e materiais didáticos.',
    impacto_cidadao: 'Este fundo financia a educação das crianças e adolescentes do município. Cada real aplicado aqui impacta diretamente a qualidade do ensino.',
    cor: '#22c55e',
  },
  FMAS: {
    nome: 'Fundo Municipal de Assistência Social',
    descricao: 'Fundo destinado ao financiamento da política de assistência social, incluindo CRAS, CREAS e programas de inclusão.',
    impacto_cidadao: 'Recursos que atendem famílias em situação de vulnerabilidade, idosos, pessoas com deficiência e crianças em risco social.',
    cor: '#06b6d4',
  },
  FMIS: {
    nome: 'Fundo Municipal da Saúde',
    descricao: 'Fundo que concentra os recursos destinados ao SUS municipal, incluindo atendimento básico, medicamentos e hospitais.',
    impacto_cidadao: 'Financia postos de saúde, distribuição de medicamentos, atendimento hospitalar e campanhas de vacinação para toda a população.',
    cor: '#f97316',
  },
  FMDCA: {
    nome: 'Fundo Municipal dos Direitos da Criança e do Adolescente',
    descricao: 'Fundo para ações de proteção e promoção dos direitos de crianças e adolescentes no município.',
    impacto_cidadao: 'Investe em programas de proteção à infância, atividades culturais, esportivas e educativas para jovens.',
    cor: '#a855f7',
  },
  FUNCESP: {
    nome: 'Fundo de Previdência dos Servidores Públicos Municipais',
    descricao: 'Fundo previdenciário que garante aposentadorias e pensões dos servidores públicos do município.',
    impacto_cidadao: 'Garante o pagamento de aposentadorias dos servidores municipais que dedicaram sua vida ao serviço público.',
    cor: '#f43f5e',
  },
  OUTROS: {
    nome: 'Outros Fundos e Movimentações',
    descricao: 'Demais fundos e movimentações financeiras extraordinárias do município.',
    impacto_cidadao: 'Inclui diversas movimentações financeiras que não se enquadram nos fundos específicos acima.',
    cor: '#64748b',
  },
};
