'use client';

import { motion } from 'framer-motion';

import { formatCurrency, formatPercent } from '@/lib/utils';
import type { KPICardData } from '@/types';

interface KPICardProps {
  data: KPICardData;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  showTrend?: boolean;
  _animated?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function KPICard({
  data,
  size = 'md',
  showSparkline = false,
  showTrend = true,
  _animated = true,
  onClick,
  className = '',
}: KPICardProps) {
  const {
    titulo,
    valor,
    tipo,
    prefixo,
    sufixo,
    variacao,
    variacao_tipo,
    periodo_comparacao,
    sparkline_data,
    tendencia,
    alerta,
  } = data;

  const formattedValue = (() => {
    switch (tipo) {
      case 'currency':
        return formatCurrency(valor, { compact: valor > 10000, showSymbol: true });
      case 'percent':
        return formatPercent(valor);
      default:
        return `${prefixo || ''}${valor.toLocaleString('pt-BR')}${sufixo || ''}`;
    }
  })();

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSizeClasses = {
    sm: 'text-headline-md',
    md: 'text-headline-lg',
    lg: 'text-display-sm',
  };

  const variacaoColor = (() => {
    if (!variacao) return 'text-on-surface-variant';
    if (variacao_tipo === 'positiva') return 'text-secondary';
    if (variacao_tipo === 'negativa') return 'text-error';
    return 'text-on-surface-variant';
  })();

  const variacaoIconName = (() => {
    if (!variacao) return null;
    if (tendencia === 'alta') return 'trending_up';
    if (tendencia === 'baixa') return 'trending_down';
    return 'remove';
  })();

  const cardIconName = (() => {
    if (titulo.includes('Receita')) return 'account_balance_wallet';
    if (titulo.includes('Despesa')) return 'payments';
    if (titulo.includes('Superávit') || titulo.includes('Déficit')) return 'savings';
    if (titulo.includes('Execução')) return 'percent';
    return 'monitoring';
  })();

  const iconColorClass = (() => {
    if (titulo.includes('Receita')) return 'text-secondary bg-secondary/10';
    if (titulo.includes('Despesa')) return 'text-error bg-error/10';
    if (titulo.includes('Superávit')) return 'text-secondary bg-secondary/10';
    if (titulo.includes('Déficit')) return 'text-error bg-error/10';
    if (titulo.includes('Execução')) return 'text-tertiary bg-tertiary/10';
    return 'text-primary bg-primary/10';
  })();

  const glowHoverClass = (() => {
    if (titulo.includes('Receita') || titulo.includes('Superávit')) return 'hover:shadow-glow-green';
    if (titulo.includes('Despesa') || titulo.includes('Déficit')) return 'hover:shadow-glow-red';
    if (titulo.includes('Execução')) return 'hover:shadow-glow-gold';
    return 'hover:shadow-glow-primary';
  })();

  return (
    <motion.div
      className={`
        glass-card hover:-translate-y-1 transition-all duration-500
        ${glowHoverClass}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconColorClass}`}>
          <span className="material-symbols-rounded text-[22px]">{cardIconName}</span>
        </div>
        {alerta && (
          <span
            className={`
              chip
              ${alerta.tipo === 'info' ? 'chip-primary' : ''}
              ${alerta.tipo === 'warning' ? 'chip-tertiary bg-tertiary/10 text-tertiary border border-tertiary/20' : ''}
              ${alerta.tipo === 'danger' ? 'chip-error' : ''}
            `}
          >
            {alerta.mensagem}
          </span>
        )}
      </div>

      <p className="kpi-label mb-2 text-on-surface-variant/80">{titulo}</p>

      <p className={`${valueSizeClasses[size]} font-display font-bold text-on-surface tracking-tight mb-4`}>
        {formattedValue}
      </p>

      {showSparkline && sparkline_data && sparkline_data.length > 0 && (
        <div className="h-10 mb-4 rounded-lg bg-surface-container/50 animate-pulse border border-outline-variant/10" />
      )}

      {showTrend && variacao !== undefined && (
        <div className="flex items-center gap-2 mt-auto">
          {variacaoIconName && (
            <span className={`material-symbols-rounded text-lg ${variacaoColor}`}>
              {variacaoIconName}
            </span>
          )}
          <span className={`text-sm font-semibold ${variacaoColor}`}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)}%
          </span>
          {periodo_comparacao && (
            <span className="text-xs font-medium text-on-surface-variant/60">
              vs {periodo_comparacao}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
