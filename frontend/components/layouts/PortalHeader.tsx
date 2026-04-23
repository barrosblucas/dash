'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useThemeStore } from '@/stores/themeStore';

interface NavItem {
  name: string;
  href: string;
  active?: boolean;
}

const portalNav: NavItem[] = [
  { name: 'Início', href: '/' },
  { name: 'Painel Financeiro', href: '/dashboard' },
  { name: 'Obras Públicas', href: '/obras' },
  { name: 'Transparência', href: '/transparencia' },
  { name: 'Serviços', href: '/servicos' },
];

export default function PortalHeader() {
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full z-50">
      <div
        className="bg-[#f8f9ff]/80 dark:bg-surface/80 backdrop-blur-3xl
                    shadow-[0_1px_0_0_rgba(0,45,98,0.05)]"
      >
        <div className="flex justify-between items-center w-full px-6 sm:px-8 py-4 max-w-screen-2xl mx-auto">
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span
              className="material-symbols-outlined text-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
            <span className="text-title-md sm:text-title-lg font-headline font-bold tracking-tighter text-primary">
              Portal da Transparência
            </span>
          </Link>

          {/* Center — Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {portalNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  text-sm font-medium transition-colors duration-200 py-1
                  ${item.active
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-on-surface-variant
                         hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Acesso Restrito — hidden on mobile */}
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 px-6 py-3 rounded-lg
                         bg-primary text-on-primary font-headline font-bold text-sm
                         hover:bg-primary-800 transition-colors duration-200"
            >
              Acesso Restrito
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg text-on-surface-variant
                         hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Abrir menu"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-outline-variant/10 bg-surface-container-low px-6 py-4 space-y-1">
            {portalNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block mt-2 text-center px-4 py-3 rounded-lg
                         bg-primary text-on-primary font-headline font-bold text-sm"
            >
              Acesso Restrito
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
