'use client';

import { Menu, Bell, Moon, Sun } from 'lucide-react';
import { MUNICIPIO } from '@/lib/constants';
import FilterPanel from '@/components/ui/FilterPanel';
import { useThemeStore } from '@/stores/themeStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Filter Panel */}
            <div className="hidden sm:block">
              <FilterPanel />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
              aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-revenue-accent rounded-full" />
            </button>

            {/* Municipality badge */}
            <div className="hidden md:flex items-center px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg">
              <span className="text-sm text-dark-300">{MUNICIPIO.nome} - {MUNICIPIO.estado}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}