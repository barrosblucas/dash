'use client';

import {
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Building2,
  FileText,
  Plane,
  Gavel,
  BellRing,
  Sun,
  Moon,
  ArrowRight,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';

/* ────────────────────────────────────────────
   Tipos
   ──────────────────────────────────────────── */

type AccentColor = 'revenue' | 'expense' | 'forecast' | 'accent';

interface PortalCard {
  title: string;
  href: string;
  icon: LucideIcon;
  accent: AccentColor;
  description: string;
  available: boolean;
}

/* ────────────────────────────────────────────
   Dados dos cards
   ──────────────────────────────────────────── */

const cards: PortalCard[] = [
  {
    title: 'Dashboard Financeiro',
    href: '/dashboard',
    icon: LayoutDashboard,
    accent: 'revenue',
    description: 'Acompanhe receitas, despesas e indicadores financeiros do município',
    available: true,
  },
  {
    title: 'Receitas Municipais',
    href: '/receitas',
    icon: TrendingUp,
    accent: 'revenue',
    description: 'Detalhamento da arrecadação municipal por fonte e categoria',
    available: true,
  },
  {
    title: 'Despesas Municipais',
    href: '/despesas',
    icon: TrendingDown,
    accent: 'expense',
    description: 'Execução orçamentária por função e natureza da despesa',
    available: true,
  },
  {
    title: 'Movimento Extra Orçamentário',
    href: '/movimento-extra',
    icon: ArrowLeftRight,
    accent: 'forecast',
    description: 'Movimentações financeiras extraordinárias por fundo municipal',
    available: true,
  },
  {
    title: 'Acompanhamento de Obras',
    href: '/obras',
    icon: Building2,
    accent: 'revenue',
    description: 'Acompanhe as obras e projetos de infraestrutura do município',
    available: false,
  },
  {
    title: 'Gestão de Contratos',
    href: '/contratos',
    icon: FileText,
    accent: 'accent',
    description: 'Consulte contratos firmados pela administração pública municipal',
    available: false,
  },
  {
    title: 'Diárias e Passagens',
    href: '/diarias',
    icon: Plane,
    accent: 'forecast',
    description: 'Consulte as diárias e passagens concedidas pela administração',
    available: false,
  },
  {
    title: 'Licitações',
    href: '/licitacoes',
    icon: Gavel,
    accent: 'expense',
    description: 'Acompanhe os processos licitatórios do município',
    available: false,
  },
  {
    title: 'Aviso de Licitações',
    href: '/avisos-licitacoes',
    icon: BellRing,
    accent: 'accent',
    description: 'Avisos e editais de processos licitatórios em andamento',
    available: false,
  },
];

/* ────────────────────────────────────────────
   Helpers de cor por accent
   ──────────────────────────────────────────── */

function accentBorderClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    revenue: 'hover:border-revenue-500/50',
    expense: 'hover:border-expense-500/50',
    forecast: 'hover:border-forecast-500/50',
    accent: 'hover:border-accent-500/50',
  };
  return map[accent];
}

function accentIconBgClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    revenue: 'bg-revenue-500/10 text-revenue-accent',
    expense: 'bg-expense-500/10 text-expense-accent',
    forecast: 'bg-forecast-500/10 text-forecast-accent',
    accent: 'bg-accent-500/10 text-accent-500',
  };
  return map[accent];
}

function accentGlowClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    revenue: 'group-hover:shadow-glow-green',
    expense: 'group-hover:shadow-glow-orange',
    forecast: 'group-hover:shadow-glow-blue',
    accent: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  };
  return map[accent];
}

/* ────────────────────────────────────────────
   Componente principal
   ──────────────────────────────────────────── */

export default function PortalClient() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* ───── Hero Section ───── */}
      <header className="relative overflow-hidden border-b border-dark-700/50">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.08)_0%,_transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-revenue-500 to-revenue-accent rounded-2xl flex items-center justify-center shadow-glow-green">
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-dark-100">
                Portal da Transparência
              </h1>
              <p className="text-lg sm:text-xl text-dark-300 font-medium">
                Prefeitura Municipal de {MUNICIPIO.nome} — {MUNICIPIO.estado}
              </p>
            </div>

            {/* Description */}
            <p className="max-w-2xl text-dark-400 text-base sm:text-lg leading-relaxed">
              Acesse informações sobre a gestão pública, receitas, despesas,
              licitações e obras do município de {MUNICIPIO.nome} — {MUNICIPIO.estado_nome}
            </p>

            {/* Trust indicator + Theme toggle */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <Shield className="w-4 h-4 text-revenue-500" />
                <span>Dados públicos e atualizados</span>
              </div>
              <div className="w-px h-4 bg-dark-700" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dark-300 hover:text-dark-100 bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 transition-colors"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ───── Navigation Cards Grid ───── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;

            const cardContent = (
              <div
                className={`
                  group relative glass-card p-6 transition-all duration-300
                  ${accentGlowClass(card.accent)}
                  ${accentBorderClass(card.accent)}
                  ${!card.available ? 'opacity-75' : ''}
                `}
              >
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`
                      w-11 h-11 rounded-xl flex items-center justify-center
                      ${accentIconBgClass(card.accent)}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {card.available ? (
                    <span className="badge badge-success">Disponível</span>
                  ) : (
                    <span className="badge bg-dark-700/60 text-dark-400">
                      Em breve
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-dark-100 mb-2 group-hover:text-dark-50 transition-colors">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-dark-400 leading-relaxed mb-4">
                  {card.description}
                </p>

                {/* CTA indicator */}
                {card.available && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-dark-400 group-hover:text-revenue-accent transition-colors">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            );

            if (card.available) {
              return (
                <Link key={card.href} href={card.href} className="block">
                  {cardContent}
                </Link>
              );
            }

            return (
              <div key={card.href} className="block cursor-default">
                {cardContent}
              </div>
            );
          })}
        </div>
      </main>

      {/* ───── Footer ───── */}
      <footer className="border-t border-dark-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-400">
            <p className="font-medium text-dark-300">
              Portal da Transparência — {MUNICIPIO.nome} {MUNICIPIO.estado}
            </p>
            <p>
              Dados atualizados periodicamente conforme dados públicos da prefeitura
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
