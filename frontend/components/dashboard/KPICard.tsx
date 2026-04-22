'use client';

import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
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

  // Formata valor
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

  // Classes baseadas no tamanho
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

  // Cor da variação
  const variacaoColor = (() => {
    if (!variacao) return 'text-on-surface-variant';
    if (variacao_tipo === 'positiva') return 'text-revenue-accent';
    if (variacao_tipo === 'negativa') return 'text-expense-accent';
    return 'text-on-surface-variant';
  })();

  // Ícone da variação
  const variacaoIconName = (() => {
    if (!variacao) return null;
    if (tendencia === 'alta') return 'trending_up';
    if (tendencia === 'baixa') return 'trending_down';
    return 'remove';
  })();

  // Ícone do card baseado no título
  const cardIconName = (() => {
    if (titulo.includes('Receita')) return 'account_balance_wallet';
    if (titulo.includes('Despesa')) return 'payments';
    if (titulo.includes('Superávit') || titulo.includes('Déficit')) return 'savings';
    if (titulo.includes('Execução')) return 'percent';
    return 'monitoring';
  })();

  // Cor do ícone baseada no tipo
  const iconColorClass = (() => {
    if (titulo.includes('Receita')) return 'text-revenue-accent bg-revenue-500/10';
    if (titulo.includes('Despesa')) return 'text-expense-accent bg-expense-500/10';
    if (titulo.includes('Superávit')) return 'text-revenue-accent bg-revenue-500/10';
    if (titulo.includes('Déficit')) return 'text-expense-accent bg-expense-500/10';
    if (titulo.includes('Execução')) return 'text-forecast-accent bg-forecast-500/10';
    return 'text-primary bg-primary-container/20';
  })();

  return (
    <motion.div
      className={`
        kpi-card ${sizeClasses[size]} transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorClass}`}>
          <Icon name={cardIconName} size={20} />
        </div>
        {alerta && (
          <span
            className={`
              chip
              ${alerta.tipo === 'info' ? 'chip-primary' : ''}
              ${alerta.tipo === 'warning' ? 'chip-tertiary' : ''}
              ${alerta.tipo === 'danger' ? 'chip-error' : ''}
            `}
          >
            {alerta.mensagem}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="kpi-label mb-2">{titulo}</p>

      {/* Value */}
      <p className={`${valueSizeClasses[size]} font-display font-bold text-on-surface tracking-tight mb-3`}>
        {formattedValue}
      </p>

      {/* Sparkline */}
      {showSparkline && sparkline_data && sparkline_data.length > 0 && (
        <div className="h-10 mb-3">
          {/* TODO: Implementar minichart sparkline */}
          <div className="w-full h-full bg-surface-container-high/50 rounded animate-pulse" />
        </div>
      )}

      {/* Variation */}
      {showTrend && variacao !== undefined && (
        <div className="flex items-center gap-2">
          {variacaoIconName && (
            <Icon
              name={variacaoIconName}
              size={16}
              className={variacaoColor}
            />
          )}
          <span className={`text-sm font-semibold ${variacaoColor}`}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)}%
          </span>
          {periodo_comparacao && (
            <span className="text-xs text-on-surface-variant/60">
              vs {periodo_comparacao}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
