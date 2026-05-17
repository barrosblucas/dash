/**
 * Dados estáticos e helpers para o Portal Público
 */

import type { DiarioResponse } from '@/types/diario-oficial';

/* ── Cards de navegação principal ── */
export const mainNavCards = [
  {
    title: 'Prefeitura',
    description: 'Conheça a gestão, secretarias, gabinete e canais de atendimento da prefeitura.',
    icon: 'account_balance',
    href: '/prefeitura',
    accent: 'primary' as const,
    cta: 'Acessar Prefeitura',
    offset: false,
  },
  {
    title: 'Painel Financeiro',
    description: 'Acompanhe em tempo real as receitas, despesas e a saúde fiscal do município.',
    icon: 'monitoring',
    href: '/dashboard',
    accent: 'primary' as const,
    cta: 'Acessar Painel',
    offset: false,
  },
  {
    title: 'Saúde Transparente',
    description: 'Medicamentos, perfil epidemiológico, procedimentos e mapa das unidades de saúde.',
    icon: 'local_hospital',
    href: '/saude',
    accent: 'secondary' as const,
    cta: 'Acessar Saúde',
    offset: false,
  },
  {
    title: 'Obras Públicas',
    description: 'Status, investimentos e prazos de todas as construções e reformas em andamento.',
    icon: 'architecture',
    href: '/obras',
    accent: 'secondary' as const,
    cta: 'Ver Mapa de Obras',
    offset: false,
  },
  {
    title: 'Contas Públicas',
    description: 'Relatórios de gestão fiscal, balanços anuais e prestação de contas detalhada.',
    icon: 'description',
    href: '/transparencia',
    accent: 'primary' as const,
    cta: 'Consultar Documentos',
    offset: false,
  },
  {
    title: 'Aviso de Licitação',
    description: 'Acompanhe editais, prazos e concorrências públicas do município.',
    icon: 'gavel',
    href: '/avisos-licitacoes',
    accent: 'primaryContainer' as const,
    cta: 'Ver Licitações',
    offset: false,
  },
  {
    title: 'Gestão de Contratos',
    description:
      'Informações sobre os contratos e aditivos realizados entre a entidade e outras partes.',
    icon: 'handshake',
    href: '/contratos',
    accent: 'secondary' as const,
    cta: 'Consultar Contratos',
    offset: false,
  },
  {
    title: 'Legislações',
    description: 'Consulte leis, decretos, portarias e demais atos normativos do município.',
    icon: 'article',
    href: '/legislacoes',
    accent: 'secondary' as const,
    cta: 'Consultar Legislações',
    offset: false,
  },
  {
    title: 'Convênios',
    description: 'Convênios concedidos e recebidos pela administração pública municipal.',
    icon: 'diversity_3',
    href: '/convenios',
    accent: 'primary' as const,
    cta: 'Consultar Convênios',
    offset: false,
  },
  {
    title: 'Diárias e Passagens',
    description: 'Gastos com diárias e passagens pagas aos servidores públicos municipais.',
    icon: 'flight',
    href: '/diarias',
    accent: 'primaryContainer' as const,
    cta: 'Consultar Diárias',
    offset: false,
  },
  {
    title: 'Cargos e Salários',
    description: 'Quadro de cargos, vagas, ocupação e salários base do funcionalismo público.',
    icon: 'badge',
    href: '/cargos',
    accent: 'secondary' as const,
    cta: 'Consultar Cargos',
    offset: false,
  },
  {
    title: 'Emendas Parlamentares',
    description: 'Emendas individuais, de bancada e de comissão destinadas ao município.',
    icon: 'account_balance_wallet',
    href: '/emendas',
    accent: 'primary' as const,
    cta: 'Consultar Emendas',
    offset: false,
  },
  {
    title: 'Controle Patrimonial',
    description: 'Inventário de bens móveis, imóveis e veículos do patrimônio público municipal.',
    icon: 'inventory_2',
    href: '/patrimonio',
    accent: 'secondary' as const,
    cta: 'Consultar Patrimônio',
    offset: false,
  },
  {
    title: 'Planejamento Orçamentário',
    description: 'Peças do planejamento orçamentário com acesso à fonte oficial do município.',
    icon: 'policy',
    href: '/planejamento',
    accent: 'primaryContainer' as const,
    cta: 'Consultar Planejamento',
    offset: false,
  },
  {
    title: 'RGF e RREO',
    description: 'Relatórios fiscais, execução orçamentária e pareceres técnicos do TCE.',
    icon: 'fact_check',
    href: '/rgf-rreo',
    accent: 'primary' as const,
    cta: 'Consultar RGF/RREO',
    offset: false,
  },
  {
    title: 'Folha de Pagamento',
    description: 'Remuneração individual e consolidada dos servidores públicos municipais.',
    icon: 'payments',
    href: '/folha',
    accent: 'secondary' as const,
    cta: 'Consultar Folha',
    offset: false,
  },
];

/* ── Mapas de cores dos accent ── */
export const accentBorder: Record<string, string> = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  primaryContainer: 'border-primary-container',
};

export const accentIconText: Record<string, string> = {
  primary: 'text-primary group-hover:text-on-primary',
  secondary: 'text-secondary group-hover:text-on-secondary',
  primaryContainer: 'text-primary-container group-hover:text-on-primary',
};

export const accentIconBg: Record<string, string> = {
  primary: 'group-hover:bg-primary',
  secondary: 'group-hover:bg-secondary',
  primaryContainer: 'group-hover:bg-primary-container',
};

export const accentCtaText: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  primaryContainer: 'text-primary-container',
};

/* ── Helpers ── */

/** Formata valor numérico como moeda BRL compacta (ex: R$ 14,2 Mi) */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1e9) {
    return `R$ ${(value / 1e9).toFixed(2)} Bi`;
  }
  if (value >= 1e6) {
    return `R$ ${(value / 1e6).toFixed(1)} Mi`;
  }
  if (value >= 1e3) {
    return `R$ ${(value / 1e3).toFixed(0)} mil`;
  }
  return `R$ ${value.toFixed(2)}`;
}

/** Formata data ISO para dd/mm */
export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Retorna descrição amigável para a última atualização */
export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return `há ${Math.floor(days / 30)} meses`;
}

/* ── Helpers do Diário Oficial ── */

export function renderDiarioDescription(data: DiarioResponse): string {
  if (!data.tem_edicao || data.edicoes.length === 0) {
    return data.mensagem ?? 'Nenhuma edição publicada hoje.';
  }
  const regular = data.edicoes.filter((e) => !e.suplementar);
  const suplementar = data.edicoes.filter((e) => e.suplementar);
  const partes: string[] = [];
  for (const ed of regular) {
    partes.push(`Edição ${ed.numero} de ${ed.data}${ed.tamanho ? ` (${ed.tamanho})` : ''}`);
  }
  for (const ed of suplementar) {
    partes.push(`Suplementar: Edição ${ed.numero} de ${ed.data}${ed.tamanho ? ` (${ed.tamanho})` : ''}`);
  }
  return partes.join(' | ');
}

export function getDiarioLink(data: DiarioResponse): string | null {
  if (!data.tem_edicao || data.edicoes.length === 0) return null;
  const regular = data.edicoes.find((e) => !e.suplementar);
  return regular?.link_download ?? data.edicoes[0].link_download;
}
