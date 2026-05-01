'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import PortalHeader from '@/components/layouts/PortalHeader';
import PortalFooter from '@/components/layouts/PortalFooter';
import { fetchDiarioHoje } from '@/services/diario-oficial-service';
import type { DiarioResponse } from '@/types/diario-oficial';

/* ────────────────────────────────────────────
   Dados estáticos
   ──────────────────────────────────────────── */

const mainNavCards = [
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

const accentBorder: Record<string, string> = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  primaryContainer: 'border-primary-container',
};

const accentIconText: Record<string, string> = {
  primary: 'text-primary group-hover:text-on-primary',
  secondary: 'text-secondary group-hover:text-on-secondary',
  primaryContainer: 'text-primary-container group-hover:text-on-primary',
};

const accentIconBg: Record<string, string> = {
  primary: 'group-hover:bg-primary',
  secondary: 'group-hover:bg-secondary',
  primaryContainer: 'group-hover:bg-primary-container',
};

const accentCtaText: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  primaryContainer: 'text-primary-container',
};

const quickAccessItems = [
  {
    icon: 'account_balance_wallet',
    title: 'Contas Públicas',
    description: 'Status: Fechamento do último mês fiscal concluído e publicado sem ressalvas.',
    border: 'border-secondary',
    iconColor: 'text-secondary',
  },
  {
    icon: 'construction',
    title: 'Obras em Destaque',
    description: 'Atualização: Reforma da Praça Central atingiu 85% de conclusão nesta semana.',
    border: 'border-primary',
    iconColor: 'text-primary',
  },
  {
    icon: 'gavel',
    title: 'Aviso de Licitação',
    description: 'Próxima: Pregão Eletrônico 04/2024 para aquisição de merenda escolar. Data: 15/05.',
    border: 'border-primary-container',
    iconColor: 'text-primary-container',
  },
  {
    icon: 'lightbulb',
    title: 'Iluminação Pública',
    description: 'Dados: 98% de cobertura LED no município. 12 manutenções realizadas nas últimas 24h.',
    border: 'border-secondary',
    iconColor: 'text-secondary',
  },
  {
    icon: 'newspaper',
    title: 'Notícias do Município',
    description: 'Destaque: Prefeitura lança novo programa de saúde preventiva nas escolas municipais.',
    border: 'border-primary',
    iconColor: 'text-primary',
  },
];

/* ────────────────────────────────────────────
   Componente principal
   ──────────────────────────────────────────── */

export default function PortalClient() {
  const [diarioData, setDiarioData] = useState<DiarioResponse | null>(null);
  const [diarioLoading, setDiarioLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchDiarioHoje();
        if (!cancelled) setDiarioData(data);
      } catch {
        if (!cancelled) setDiarioData(null);
      } finally {
        if (!cancelled) setDiarioLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── helpers para o card do Diário Oficial ── */
  function renderDiarioDescription(data: DiarioResponse): string {
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

  function renderDiarioLink(data: DiarioResponse): string | null {
    if (!data.tem_edicao || data.edicoes.length === 0) return null;
    // Prioriza a edição regular; se não houver, usa a primeira
    const regular = data.edicoes.find((e) => !e.suplementar);
    const link = regular?.link_download ?? data.edicoes[0].link_download;
    return link;
  }

  const diarioHref = diarioData ? renderDiarioLink(diarioData) : null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ───── Header ───── */}
      <PortalHeader />

      <main className="flex-grow">
        {/* ───── Hero Section ───── */}
        <section className="hero-gradient pt-24 pb-32 px-6 sm:px-8 relative overflow-hidden">
          {/* Decorative radial gradient */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at top right, #ffffff 0%, transparent 70%)',
            }}
          />

          <div className="max-w-screen-xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left column */}
              <div className="lg:col-span-7">
                <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/80 text-white font-label text-sm font-semibold tracking-wide mb-6">
                  BANDEIRANTES - MS
                </span>

                <h1 className="font-headline font-extrabold text-4xl sm:text-5xl md:text-7xl text-white tracking-tighter leading-tight mb-4">
                  A verdade<br />em números.
                </h1>

                <p className="font-body text-xl text-white/70 leading-relaxed mb-10 max-w-2xl">
                  Acesso universal, claro e direto aos dados públicos do município.
                  Transparência não é apenas um portal, é o nosso compromisso com a sua cidadania.
                </p>

                {/* Search bar */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 max-w-2xl flex items-center shadow-[0_32px_32px_-4px_rgba(0,0,0,0.2)]">
                  <span className="material-symbols-outlined text-white pl-4 pr-2">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="O que você procura? (ex: despesas, licitações, obras...)"
                    className="w-full bg-transparent border-none text-white placeholder:text-white/50 font-body text-lg focus:ring-0 focus:outline-none"
                  />
                  <button className="bg-secondary text-on-secondary px-6 sm:px-8 py-4 rounded-lg font-headline font-bold text-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors shrink-0">
                    Buscar
                  </button>
                </div>
              </div>

              {/* Right column — stat cards (desktop only) */}
              <div className="lg:col-span-5 hidden lg:block">
                <div className="grid grid-cols-2 gap-4 opacity-90 rotate-3">
                  {/* Receitas card */}
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-2xl flex flex-col gap-4 translate-y-8">
                    <span className="material-symbols-outlined text-primary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      payments
                    </span>
                    <span className="font-headline font-bold text-primary dark:text-primary text-xl">
                      R$ 14.2M
                    </span>
                    <span className="font-body text-sm text-on-surface-variant">
                      Arrecadação Mês
                    </span>
                  </div>

                  {/* Obras card */}
                  <div className="bg-secondary p-6 rounded-xl shadow-2xl flex flex-col gap-4">
                    <span className="material-symbols-outlined text-on-secondary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      construction
                    </span>
                    <span className="font-headline font-bold text-on-secondary text-xl">
                      12 Ativas
                    </span>
                    <span className="font-body text-sm text-secondary-fixed-dim">
                      Obras em Andamento
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Main Navigation Cards ───── */}
        <section className="px-6 sm:px-8 -mt-16 relative z-20 max-w-screen-xl mx-auto pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainNavCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`
                  bg-surface-container-lowest
                  rounded-xl p-8
                  shadow-[0_32px_32px_-4px_rgba(0,25,60,0.06)]
                  dark:shadow-[0_32px_32px_-4px_rgba(0,0,0,0.3)]
                  group hover:-translate-y-2 transition-transform duration-300
                  flex flex-col h-full
                  border-b-[3px] ${accentBorder[card.accent]}
                  ${card.offset ? 'lg:translate-y-8' : ''}
                `}
              >
                <div className={`
                  w-14 h-14 rounded-full bg-surface-container-low
                  flex items-center justify-center mb-6
                  transition-colors ${accentIconBg[card.accent]} ${accentIconText[card.accent]}
                `}>
                  <span className="material-symbols-outlined text-3xl">
                    {card.icon}
                  </span>
                </div>

                <h3 className="font-headline font-extrabold text-2xl text-primary mb-3">
                  {card.title}
                </h3>

                <p className="font-body text-on-surface-variant mb-6 flex-grow">
                  {card.description}
                </p>

                <span className={`font-headline font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all ${accentCtaText[card.accent]}`}>
                  {card.cta}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ───── Quick Access / Information Hub ───── */}
        <section className="bg-surface-container-low py-20 px-6 sm:px-8">
          <div className="max-w-screen-xl mx-auto">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-primary tracking-tight mb-10 text-center">
              Painel de Informações Rápidas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ── Diário Oficial (dinâmico) ── */}
              <div
                className={`
                  bg-surface-container-lowest
                  rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow
                  border-l-4 border-primary-container
                `}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="material-symbols-outlined text-primary-container"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    menu_book
                  </span>
                  <h4 className="font-headline font-bold text-lg text-primary">
                    Diário Oficial do Dia
                  </h4>
                </div>

                {diarioLoading ? (
                  <p className="font-body text-sm text-on-surface-variant animate-pulse">
                    Carregando...
                  </p>
                ) : diarioData && diarioData.tem_edicao && diarioHref ? (
                  <a
                    href={diarioHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <p className="font-body text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      {renderDiarioDescription(diarioData)}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 font-headline font-bold text-xs text-primary-container group-hover:gap-2 transition-all">
                      Baixar PDF
                      <span className="material-symbols-outlined text-sm">download</span>
                    </span>
                  </a>
                ) : (
                  <p className="font-body text-sm text-on-surface-variant">
                    {diarioData?.mensagem ?? 'Não foi possível consultar o Diário Oficial.'}
                  </p>
                )}
              </div>

              {quickAccessItems.map((item) => (
                <div
                  key={item.title}
                  className={`
                    bg-surface-container-lowest
                    rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow
                    border-l-4 ${item.border}
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`material-symbols-outlined ${item.iconColor}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <h4 className="font-headline font-bold text-lg text-primary">
                      {item.title}
                    </h4>
                  </div>
                  <p className="font-body text-sm text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ───── Footer ───── */}
      <PortalFooter />
    </div>
  );
}
