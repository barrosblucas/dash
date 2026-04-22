'use client';

import { useState } from 'react';

import { useThemeStore } from '@/stores/themeStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className="bg-[#f8f9ff]/80 dark:bg-surface/80 backdrop-blur-2xl
                    shadow-[0_1px_0_0_rgba(0,45,98,0.05)]"
      >
        <div className="flex justify-between items-center w-full px-4 sm:px-8 py-4 max-w-[1920px] mx-auto">
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg text-on-surface-variant
                         hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Abrir menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Mobile title */}
            <span className="md:hidden text-title-sm font-headline font-bold text-on-surface">
              Gestão Municipal
            </span>

            {/* Desktop search */}
            <div className={`relative hidden md:flex items-center transition-all duration-300 ${searchFocused ? 'w-80' : 'w-64'}`}>
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-surface-container-highest dark:bg-surface-container-high
                           rounded-full pl-10 pr-4 py-2.5 text-body-md text-on-surface
                           placeholder:text-on-surface-variant/50
                           focus:outline-none focus:ring-2 focus:ring-primary/20
                           transition-all duration-200"
              />
            </div>
          </div>

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

            {/* Settings */}
            <button
              className="p-2.5 rounded-lg text-on-surface-variant
                         hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Configurações"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* Acesso à Informação — hidden on mobile */}
            <button
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-primary text-on-primary font-headline font-bold text-sm
                         hover:bg-primary-800 transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">policy</span>
              Acesso à Informação
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
