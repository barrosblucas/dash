'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/prefeitura', label: 'A Prefeitura', icon: 'account_balance' },
  { href: '/prefeitura/prefeito-e-vice', label: 'Prefeito e Vice', icon: 'group' },
  { href: '/prefeitura/gabinete', label: 'Gabinete', icon: 'workspaces' },
  { href: '/prefeitura/secretarias', label: 'Secretarias', icon: 'corporate_fare' },
  { href: '/prefeitura/reparticoes', label: 'Repartições', icon: 'location_on' },
];

export default function PrefeituraFeatureNav() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto pb-1" aria-label="Navegação da Prefeitura">
      <div className="flex min-w-max gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'border-primary/30 bg-primary text-on-primary'
                  : 'border-outline/15 bg-surface-container-low text-on-surface-variant hover:border-primary/20 hover:text-primary'
              )}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
