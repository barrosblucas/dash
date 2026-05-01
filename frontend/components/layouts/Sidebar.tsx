'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  { name: 'Previsões', href: '/forecast', icon: 'insights' },
  { name: 'Comparativo', href: '/comparativo', icon: 'compare_arrows' },
  { name: 'Mov. Extra', href: '/movimento-extra', icon: 'account_balance' },
  { name: 'Saúde', href: '/saude', icon: 'health_and_safety' },
  { name: 'Obras', href: '/obras', icon: 'construction' },
  { name: 'Licitações', href: '/avisos-licitacoes', icon: 'gavel' },
  { name: 'Legislações', href: '/legislacoes', icon: 'article' },
  { name: 'Relatórios', href: '/relatorios', icon: 'description' },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-surface-container-low">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-on-primary"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", fontSize: '20px' }}
          >
            account_balance
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-lg font-headline font-bold text-on-surface truncate">
            Gestão Municipal
          </span>
          <span className="text-label-sm text-on-surface-variant font-label">
            Exercício 2024
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors md:hidden"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }
              `}
            >
              <span
                className={`
                  material-symbols-outlined text-[20px] leading-none transition-colors
                  ${isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant group-hover:text-on-surface'
                  }
                `}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
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
      <div className="p-4 space-y-3">
        {/* Download open data */}
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                     bg-secondary text-on-secondary font-headline font-bold text-sm
                     hover:bg-secondary-600 transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Baixar Dados Abertos
        </button>

        {/* Links */}
        <div className="flex items-center justify-center gap-4 text-label-sm text-on-surface-variant">
          <a href="#" className="hover:text-on-surface transition-colors">
            Suporte
          </a>
          <span className="text-outline-variant">·</span>
          <a href="#" className="hover:text-on-surface transition-colors">
            Privacidade
          </a>
        </div>
      </div>
    </div>
  );
}
