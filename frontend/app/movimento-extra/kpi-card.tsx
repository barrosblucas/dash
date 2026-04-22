'use client';

import { formatCurrency } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number;
  count?: number;
  iconName: string;
  accentColor: string;
}

export function KpiCard({ label, value, count, iconName, accentColor }: KpiCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient transition-all duration-300 hover:shadow-ambient-lg">
      <div className="flex items-start justify-between mb-3">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <span className="material-symbols-outlined text-[20px]">{iconName}</span>
        </div>
      </div>
      <p className="text-headline-lg font-display font-bold text-on-surface">
        {formatCurrency(value)}
      </p>
      {count !== undefined && (
        <p className="text-label-md text-on-surface-variant/60 mt-1.5">
          {count} itens neste período
        </p>
      )}
    </div>
  );
}
