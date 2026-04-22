'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MUNICIPIO } from '@/lib/constants';

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
  { name: 'Visão Geral', href: '/dashboard', icon: 'space_dashboard' },
  { name: 'Receitas', href: '/receitas', icon: 'trending_up' },
  { name: 'Despesas', href: '/despesas', icon: 'trending_down' },
  { name: 'Previsões', href: '/forecast', icon: 'insights' },
  { name: 'Comparativo', href: '/comparativo', icon: 'compare_arrows' },
  { name: 'Relatórios', href: '/relatorios', icon: 'description' },
  { name: 'Movimento Extra', href: '/movimento-extra', icon: 'account_balance_wallet' },
  { name: 'Licitações', href: '/avisos-licitacoes', icon: 'gavel' },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Logo Header */}
      <div className="flex items-center gap-3 h-20 px-6 mt-2">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-glow-primary">
          <span className="material-symbols-rounded text-white text-[22px]">account_balance</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-display font-bold text-on-surface truncate">
            Transparência
          </span>
          <span className="text-xs font-medium text-on-surface-variant">
            {MUNICIPIO.nome}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors lg:hidden"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                transition-all duration-300 relative overflow-hidden
                ${isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-primary" />
              )}

              <span className={`material-symbols-rounded text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>

              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 mx-4 mb-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 flex flex-col items-center text-center">
         <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
           Período Base
         </p>
         <p className="text-sm font-bold text-on-surface">2016 - 2026</p>
      </div>
    </div>
  );
}
