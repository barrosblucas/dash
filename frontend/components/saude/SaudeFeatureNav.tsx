'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { saudeFeatureCards } from '@/lib/saude-utils';
import { cn } from '@/lib/utils';

export default function SaudeFeatureNav() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto pb-1" aria-label="Navegação da Saúde Transparente">
      <div className="flex min-w-max gap-2">
        {saudeFeatureCards.map((card) => {
          const isActive = pathname === card.href;

          return (
            <Link
              key={card.href}
              href={card.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'border-primary/30 bg-primary text-on-primary'
                  : 'border-outline/15 bg-surface-container-low text-on-surface-variant hover:border-primary/20 hover:text-primary'
              )}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                {card.icon}
              </span>
              {card.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
