'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';

/* ────────────────────────────────────────────
   Tipos
   ──────────────────────────────────────────── */

type AccentColor = 'revenue' | 'expense' | 'forecast' | 'accent';

interface PortalCard {
  title: string;
  href: string;
  icon: string;
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
    icon: 'dashboard',
    accent: 'revenue',
    description: 'Acompanhe receitas, despesas e indicadores financeiros do município',
    available: true,
  },
  {
    title: 'Receitas Municipais',
    href: '/receitas',
    icon: 'trending_up',
    accent: 'revenue',
    description: 'Detalhamento da arrecadação municipal por fonte e categoria',
    available: true,
  },
  {
    title: 'Despesas Municipais',
    href: '/despesas',
    icon: 'trending_down',
    accent: 'expense',
    description: 'Execução orçamentária por função e natureza da despesa',
    available: true,
  },
  {
    title: 'Movimento Extra Orçamentário',
    href: '/movimento-extra',
    icon: 'swap_horiz',
    accent: 'forecast',
    description: 'Movimentações financeiras extraordinárias por fundo municipal',
    available: true,
  },
  {
    title: 'Acompanhamento de Obras',
    href: '/obras',
    icon: 'domain',
    accent: 'revenue',
    description: 'Acompanhe as obras e projetos de infraestrutura do município',
    available: false,
  },
  {
    title: 'Gestão de Contratos',
    href: '/contratos',
    icon: 'description',
    accent: 'accent',
    description: 'Consulte contratos firmados pela administração pública municipal',
    available: false,
  },
  {
    title: 'Diárias e Passagens',
    href: '/diarias',
    icon: 'flight',
    accent: 'forecast',
    description: 'Consulte as diárias e passagens concedidas pela administração',
    available: false,
  },
  {
    title: 'Licitações',
    href: '/licitacoes',
    icon: 'gavel',
    accent: 'expense',
    description: 'Acompanhe os processos licitatórios do município',
    available: false,
  },
  {
    title: 'Aviso de Licitações',
    href: '/avisos-licitacoes',
    icon: 'notifications_active',
    accent: 'accent',
    description: 'Avisos e editais de processos licitatórios em andamento',
    available: true,
  },
];

/* ────────────────────────────────────────────
   Helpers de cor por accent
   ──────────────────────────────────────────── */

function accentIconBgClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    revenue: 'bg-revenue-500/10 text-revenue-accent',
    expense: 'bg-expense-500/10 text-expense-accent',
    forecast: 'bg-forecast-500/10 text-forecast-accent',
    accent: 'bg-primary-container/20 text-primary',
  };
  return map[accent];
}

function accentGlowClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    revenue: 'group-hover:shadow-glow-green',
    expense: 'group-hover:shadow-glow-red',
    forecast: 'group-hover:shadow-glow-gold',
    accent: 'group-hover:shadow-[0_0_20px_rgba(161,201,255,0.15)]',
  };
  return map[accent];
}

/* ────────────────────────────────────────────
   Animações
   ──────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/* ────────────────────────────────────────────
   Componente principal
   ──────────────────────────────────────────── */

export default function PortalClient() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ───── Hero Section ───── */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,108,71,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(194,155,0,0.08)_0%,_transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <motion.div
            className="flex flex-col items-center text-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Logo */}
            <motion.div
              variants={heroVariants}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-ambient"
            >
              <Icon name="bar_chart" size={40} className="text-white" />
            </motion.div>

            {/* Title */}
            <motion.div variants={heroVariants} className="space-y-4">
              <h1 className="text-display-sm sm:text-headline-lg lg:text-display-md font-display font-bold tracking-tight text-white">
                Portal da Transparência
              </h1>
              <p className="text-body-lg sm:text-title-lg text-white/80 font-medium">
                Prefeitura Municipal de {MUNICIPIO.nome} — {MUNICIPIO.estado}
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={heroVariants}
              className="max-w-2xl text-body-md text-white/60 leading-relaxed"
            >
              Acesse informações sobre a gestão pública, receitas, despesas,
              licitações e obras do município de {MUNICIPIO.nome} — {MUNICIPIO.estado_nome}
            </motion.p>

            {/* Trust indicator + Theme toggle */}
            <motion.div
              variants={heroVariants}
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Icon name="verified_user" size={16} className="text-secondary" />
                <span>Dados públicos e atualizados</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-colors"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                <Icon
                  name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  size={16}
                />
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ───── Navigation Cards Grid ───── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {cards.map((card) => {
            const cardContent = (
              <motion.div
                variants={itemVariants}
                className={`
                  group relative glass-card p-6 transition-all duration-300
                  ${accentGlowClass(card.accent)}
                  ${!card.available ? 'opacity-60' : ''}
                  ${card.available ? 'hover:-translate-y-1' : ''}
                `}
              >
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${accentIconBgClass(card.accent)}
                      transition-transform duration-300 group-hover:scale-110
                    `}
                  >
                    <Icon name={card.icon} size={24} />
                  </div>

                  {card.available ? (
                    <span className="chip-secondary">Disponível</span>
                  ) : (
                    <span className="chip bg-surface-container-high text-on-surface-variant">
                      Em breve
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-title-md font-display font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-body-sm text-on-surface-variant leading-relaxed mb-5">
                  {card.description}
                </p>

                {/* CTA indicator */}
                {card.available && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant group-hover:text-secondary transition-colors">
                    <span>Acessar</span>
                    <Icon
                      name="arrow_forward"
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                )}

                {/* Decorative corner accent for available cards */}
                {card.available && (
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                      card.accent === 'revenue' ? 'bg-revenue-accent' :
                      card.accent === 'expense' ? 'bg-expense-accent' :
                      card.accent === 'forecast' ? 'bg-forecast-accent' :
                      'bg-primary'
                    }`} />
                  </div>
                )}
              </motion.div>
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
        </motion.div>
      </main>

      {/* ───── Footer ───── */}
      <footer className="bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant"
          >
            <div className="flex items-center gap-2">
              <Icon name="account_balance" size={18} className="text-primary" />
              <p className="font-medium text-on-surface">
                Portal da Transparência — {MUNICIPIO.nome} {MUNICIPIO.estado}
              </p>
            </div>
            <p className="text-center sm:text-right">
              Dados atualizados periodicamente conforme dados públicos da prefeitura
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
