import Icon from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils';

/** Card de KPI */
export function KpiCard({
  label,
  value,
  count,
  iconName,
  accentColor,
}: {
  label: string;
  value: number;
  count?: number;
  iconName: string;
  accentColor: string;
}) {
  return (
    <div className="metric-card transition-all duration-300 hover:shadow-ambient">
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <Icon name={iconName} size={20} />
        </div>
      </div>
      <p className="metric-value">{formatCurrency(value)}</p>
      {count !== undefined && (
        <p className="text-label-md text-on-surface-variant/60 mt-1.5">{count} itens neste período</p>
      )}
    </div>
  );
}
