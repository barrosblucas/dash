/**
 * Dados estáticos e helpers para o Portal Público
 */

import type { DiarioResponse } from '@/types/diario-oficial';

/* ── Cards de navegação principal ── */
export const mainNavCards = [
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
    offset: true,
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
    offset: true,
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
