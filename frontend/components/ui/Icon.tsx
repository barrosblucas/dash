import { cn } from '@/lib/utils';

interface IconProps {
  name: string;
  variant?: 'outlined' | 'rounded' | 'sharp';
  filled?: boolean;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Material Symbols icon component.
 *
 * Usage:
 *   <Icon name="bar_chart" />
 *   <Icon name="trending_up" filled size={24} />
 *   <Icon name="account_balance" variant="rounded" />
 */
export default function Icon({
  name,
  variant = 'outlined',
  filled = false,
  size = 24,
  className,
  style,
}: IconProps) {
  const fontClass =
    variant === 'rounded'
      ? 'material-symbols-rounded'
      : variant === 'sharp'
        ? 'material-symbols-sharp'
        : 'material-symbols-outlined';

  return (
    <span
      className={cn(fontClass, 'select-none', className)}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
