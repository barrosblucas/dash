'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  FileDown,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { MUNICIPIO } from '@/lib/constants';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Receitas', href: '/receitas', icon: TrendingUp },
  { name: 'Despesas', href: '/despesas', icon: TrendingDown },
  { name: 'Previsões', href: '/forecast', icon: BarChart3 },
  { name: 'Comparativo', href: '/comparativo', icon: Calendar },
  { name: 'Relatórios', href: '/relatorios', icon: FileDown },
];

const secondaryNavigation = [
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
  { name: 'Ajuda', href: '/ajuda', icon: HelpCircle },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-revenue-500 to-revenue-accent rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-dark-100">Financeiro</span>
            <span className="text-xs text-dark-400">{MUNICIPIO.nome}</span>
          </div>
        </Link>
        
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-dark-400 hover:text-dark-100 rounded-lg"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-revenue-500/10 text-revenue-accent border-r-2 border-revenue-accent'
                    : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-revenue-accent' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-dark-700" />

        {/* Secondary navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-all"
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <div className="px-3 py-2 bg-dark-800/50 rounded-lg">
          <p className="text-xs text-dark-400">Período dos dados</p>
          <p className="text-sm font-medium text-dark-200">2016 - 2026</p>
        </div>
      </div>
    </div>
  );
}