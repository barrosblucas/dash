'use client';

import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';
import FilterPanel from '@/components/ui/FilterPanel';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-4 z-40 mx-4 sm:mx-6 lg:mx-8 mb-4">
      <div className="glass-card rounded-[2rem] px-4 py-2 border-none">
        <div className="flex items-center justify-between h-12">
          {/* Left: Mobile Menu & Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Abrir menu"
            >
              <span className="material-symbols-rounded">menu</span>
            </button>

            <div className="hidden sm:block">
              <FilterPanel />
            </div>
          </div>

          {/* Right: Theme Toggle & Location Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors bg-surface-container/50"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              <span className="material-symbols-rounded">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Municipality badge */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20">
              <span className="material-symbols-rounded text-lg text-secondary">location_on</span>
              <span className="text-sm font-semibold text-on-surface-variant">
                {MUNICIPIO.nome} — {MUNICIPIO.estado}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
