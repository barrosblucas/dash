import { formatCurrency } from '@/lib/utils';

/** Card de KPI */
export function KpiCard({
  label,
  value,
  count,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: number;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-5 transition-all duration-200 hover:border-dark-600/60">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-dark-400">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-dark-100 tracking-tight">{formatCurrency(value)}</p>
      {count !== undefined && (
        <p className="text-xs text-dark-500 mt-1.5">{count} itens neste período</p>
      )}
    </div>
  );
}
