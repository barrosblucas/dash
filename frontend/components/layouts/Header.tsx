'use client';

import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';
import Icon from '@/components/ui/Icon';
import FilterPanel from '@/components/ui/FilterPanel';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 glass-float border-b border-outline-variant/10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Abrir menu"
            >
              <Icon name="menu" size={22} />
            </button>

            <div className="hidden sm:block">
              <FilterPanel />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              <Icon
                name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                size={20}
              />
            </button>

            {/* Municipality badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high">
              <Icon name="location_on" size={16} className="text-secondary" />
              <span className="text-label-md text-on-surface-variant">
                {MUNICIPIO.nome} — {MUNICIPIO.estado}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
