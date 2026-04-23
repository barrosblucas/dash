'use client';

import { formatLastSyncedLabel } from '@/lib/saude-utils';

interface SaudeSyncBadgeProps {
  value: string | null | undefined;
}

export default function SaudeSyncBadge({ value }: SaudeSyncBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
      <span className="material-symbols-outlined text-sm">sync</span>
      {formatLastSyncedLabel(value)}
    </span>
  );
}
