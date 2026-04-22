'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useThemeStore } from '@/stores/themeStore';
import { MUNICIPIO } from '@/lib/constants';
import Icon from '@/components/ui/Icon';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navigation: NavItem[] = [
  { name: 'Portal', href: '/', icon: 'home' },
  { name: 'Dashboard', href: '/dashboard', icon: 'space_dashboard' },
  { name: 'Receitas', href: '/receitas', icon: 'trending_up' },
  { name: 'Despesas', href: '/despesas', icon: 'trending_down' },
  { name: 'Previsoes', href: '/forecast', icon: 'insights' },
  { name: 'Comparativo', href: '/comparativo', icon: 'compare_arrows' },
  { name: 'Relatorios', href: '/relatorios', icon: 'description' },
  { name: 'Mov. Extra', href: '/movimento-extra', icon: 'account_balance' },
  { name: 'Licitações', href: '/avisos-licitacoes', icon: 'gavel' },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex flex-col h-full bg-surface-container-low">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Icon name="account_balance" filled size={20} className="text-on-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-lg font-display font-semibold text-on-surface truncate">
            Financeiro
          </span>
          <span className="text-label-sm text-on-surface-variant">
            {MUNICIPIO.nome}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors lg:hidden"
            aria-label="Fechar menu"
          >
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }
              `}
            >
              <span
                className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-transparent text-on-surface-variant group-hover:text-on-surface'
                  }
                `}
              >
                <Icon name={item.icon} filled={isActive} size={20} />
              </span>
              <span className="truncate">{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                     transition-all duration-200"
        >
          <span className="flex items-center justify-center w-8 h-8">
            <Icon
              name={theme === 'dark' ? 'light_mode' : 'dark_mode'}
              size={20}
            />
          </span>
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>

        {/* Data period badge */}
        <div className="px-3 py-2.5 rounded-xl bg-surface-container-high">
          <p className="text-label-sm text-on-surface-variant">Periodo dos dados</p>
          <p className="text-label-md font-medium text-on-surface mt-0.5">2016 - 2026</p>
        </div>
      </div>
    </div>
  );
}
