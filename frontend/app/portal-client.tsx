'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';

// --- Types ---
type AccentColor = 'revenue' | 'expense' | 'forecast' | 'accent';

interface NavigationCard {
  title: string;
  href: string;
  icon: string;
  accent: AccentColor;
  description: string;
  available: boolean;
  size?: 'large' | 'medium' | 'small';
}

const bentoItems: NavigationCard[] = [
  {
    title: 'Visão Geral',
    href: '/dashboard',
    icon: 'dashboard',
    accent: 'accent',
    description: 'Acompanhe os principais indicadores da gestão pública municipal',
    available: true,
    size: 'large',
  },
  {
    title: 'Receitas',
    href: '/receitas',
    icon: 'account_balance_wallet',
    accent: 'revenue',
    description: 'Arrecadação e repasses ao município',
    available: true,
    size: 'medium',
  },
  {
    title: 'Despesas',
    href: '/despesas',
    icon: 'payments',
    accent: 'expense',
    description: 'Aplicação dos recursos públicos',
    available: true,
    size: 'medium',
  },
  {
    title: 'Previsões',
    href: '/forecast',
    icon: 'monitoring',
    accent: 'forecast',
    description: 'Análise de tendências',
    available: true,
    size: 'small',
  },
  {
    title: 'Comparativo',
    href: '/comparativo',
    icon: 'balance',
    accent: 'accent',
    description: 'Análise entre exercícios financeiros',
    available: true,
    size: 'small',
  },
  {
    title: 'Licitações',
    href: '/licitacoes',
    icon: 'gavel',
    accent: 'accent',
    description: 'Acompanhe os processos licitatórios do município',
    available: false,
    size: 'medium',
  },
  {
    title: 'Contratos',
    href: '/contratos',
    icon: 'description',
    accent: 'accent',
    description: 'Contratos firmados e vigentes',
    available: false,
    size: 'medium',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

function getAccentColors(accent: AccentColor) {
  switch (accent) {
    case 'revenue':
      return { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20', glow: 'group-hover:shadow-glow-green', gradient: 'from-secondary/20 to-transparent' };
    case 'expense':
      return { bg: 'bg-error/10', text: 'text-error', border: 'border-error/20', glow: 'group-hover:shadow-glow-red', gradient: 'from-error/20 to-transparent' };
    case 'forecast':
      return { bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/20', glow: 'group-hover:shadow-glow-gold', gradient: 'from-tertiary/20 to-transparent' };
    case 'accent':
    default:
      return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', glow: 'group-hover:shadow-glow-primary', gradient: 'from-primary/20 to-transparent' };
  }
}

export default function PortalClient() {
  const { theme, toggleTheme } = useThemeStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Removido o block com mounted para não quebrar o SSR da página inicial

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface text-on-surface">
      {/* ── Dynamic Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px] mix-blend-multiply animate-float" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: '4s' }} />

        {/* Dark mode adjustments */}
        <div className="hidden dark:block absolute inset-0 bg-surface/80 backdrop-blur-[100px]" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-screen flex flex-col">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-glow-primary text-white">
              <span className="material-symbols-rounded text-2xl">account_balance</span>
            </div>
            <div>
              <h2 className="text-title-lg font-display font-bold leading-tight">Transparência</h2>
              <p className="text-label-md text-on-surface-variant font-medium tracking-wide uppercase">{MUNICIPIO.nome} - {MUNICIPIO.estado}</p>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleTheme}
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label="Alternar tema"
          >
            <span className="material-symbols-rounded">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </motion.button>
        </header>

        {/* ── Hero / Bento Grid ── */}
        <main className="flex-1 flex flex-col justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,_auto)]"
          >
            {/* Intro / Welcome Box (Spans large area) */}
            <motion.div
              variants={itemVariants}
              className="md:col-span-6 lg:col-span-8 glass-card overflow-hidden relative p-8 lg:p-12 flex flex-col justify-end group border-none shadow-ambient-lg bg-primary/5 dark:bg-primary/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold mb-6 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Dados atualizados em tempo real
                </div>
                <h1 className="text-display-sm lg:text-display-md font-display font-bold text-on-surface mb-4 tracking-tight leading-[1.1]">
                  Uma nova visão sobre a <br className="hidden lg:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    Gestão Pública
                  </span>
                </h1>
                <p className="text-body-lg text-on-surface-variant max-w-xl font-medium">
                  Acompanhe de forma clara, moderna e intuitiva os dados financeiros e administrativos da nossa cidade.
                </p>
              </div>
            </motion.div>

            {/* Quick Stats or Image Box */}
            <motion.div
              variants={itemVariants}
              className="md:col-span-3 lg:col-span-4 glass-card p-6 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-rounded text-9xl text-primary">analytics</span>
              </div>
              <h3 className="text-title-md font-medium text-on-surface-variant mb-2">População Estimada</h3>
              <p className="text-display-sm font-display font-bold text-primary mb-6">31.273</p>

              <h3 className="text-title-md font-medium text-on-surface-variant mb-2">IDHM</h3>
              <p className="text-headline-md font-display font-bold text-secondary">0,727</p>
            </motion.div>

            {/* Render Bento Cards */}
            {bentoItems.map((item) => {
              const styles = getAccentColors(item.accent);

              // Determine grid sizing based on predefined size
              let colSpan = "md:col-span-3 lg:col-span-4";
              if (item.size === 'large') colSpan = "md:col-span-6 lg:col-span-8";
              if (item.size === 'small') colSpan = "md:col-span-3 lg:col-span-3";
              if (item.size === 'medium') colSpan = "md:col-span-3 lg:col-span-4";

              const CardContent = (
                <div className={`h-full w-full glass-card p-6 flex flex-col relative overflow-hidden group transition-all duration-500
                  ${item.available ? 'hover:-translate-y-2 cursor-pointer' : 'opacity-60 grayscale'}
                  ${item.available ? styles.glow : ''}
                `}
                onMouseEnter={() => setHoveredCard(item.title)}
                onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Subtle Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Top row: Icon + Status */}
                  <div className="flex items-start justify-between mb-auto relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${styles.bg} ${styles.text} border ${styles.border} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <span className="material-symbols-rounded text-3xl">{item.icon}</span>
                    </div>

                    {!item.available && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                        Em breve
                      </span>
                    )}
                    {item.available && hoveredCard === item.title && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`text-sm font-bold ${styles.text} flex items-center gap-1`}>
                        Acessar <span className="material-symbols-rounded text-lg">arrow_forward</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Bottom row: Text */}
                  <div className="relative z-10 mt-8">
                    <h3 className={`text-headline-sm font-display font-bold mb-2 transition-colors duration-300 ${item.available ? 'group-hover:' + styles.text : 'text-on-surface'}`}>
                      {item.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant font-medium line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              );

              return (
                <motion.div key={item.title} variants={itemVariants} className={colSpan}>
                  {item.available ? (
                    <Link href={item.href} className="block h-full">
                      {CardContent}
                    </Link>
                  ) : (
                    <div className="h-full cursor-not-allowed">
                      {CardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </main>

        {/* ── Footer ── */}
        <footer className="mt-16 pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between text-sm text-on-surface-variant font-medium gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-primary">verified</span>
            <span>Dados Oficiais e Abertos</span>
          </div>
          <p>© {new Date().getFullYear()} Prefeitura Municipal de {MUNICIPIO.nome}</p>
        </footer>
      </div>
    </div>
  );
}
