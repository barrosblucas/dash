'use client';

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

  // Ícone do card baseado no título
  const iconName = (() => {
    if (titulo.includes('Receita')) return 'account_balance_wallet';
    if (titulo.includes('Despesa')) return 'payments';
    if (titulo.includes('Superávit') || titulo.includes('Déficit')) return 'savings';
    if (titulo.includes('Execução')) return 'percent';
    return 'monitoring';
  })();

  // Cor do ícone baseada no tipo
  const iconStyle = (() => {
    if (titulo.includes('Receita')) return 'bg-revenue-500/10 text-revenue-accent';
    if (titulo.includes('Despesa')) return 'bg-expense-500/10 text-expense-accent';
    if (titulo.includes('Superávit')) return 'bg-revenue-500/10 text-revenue-accent';
    if (titulo.includes('Déficit')) return 'bg-expense-500/10 text-expense-accent';
    if (titulo.includes('Execução')) return 'bg-forecast-500/10 text-forecast-accent';
    return 'bg-primary-container/20 text-primary';
  })();

  // Cor da variação
  const trendColor = (() => {
    if (!variacao) return 'text-on-surface-variant';
    if (variacao_tipo === 'positiva') return 'text-revenue-accent';
    if (variacao_tipo === 'negativa') return 'text-expense-accent';
    return 'text-on-surface-variant';
  })();

  const trendIcon = (() => {
    if (!variacao) return null;
    if (tendencia === 'alta') return 'trending_up';
    if (tendencia === 'baixa') return 'trending_down';
    return 'remove';
  })();

  // Tamanhos
  const iconSize = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  const padding = size === 'sm' ? 'p-4' : 'p-6';
  const valueClass = size === 'lg' ? 'text-display-sm' : size === 'sm' ? 'text-headline-md' : 'text-headline-md';

  return (
    <div
      className={`
        bg-surface-container-lowest
        rounded-xl shadow-ambient hover:shadow-ambient-lg
        transition-shadow duration-300
        ${padding} ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header: ícone + alerta */}
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconSize} rounded-full flex items-center justify-center ${iconStyle}`}>
          <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? 20 : 22 }}>
            {iconName}
          </span>
        </div>
        {alerta && (
          <span
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium
              ${alerta.tipo === 'info' ? 'bg-primary-container/20 text-primary' : ''}
              ${alerta.tipo === 'warning' ? 'bg-tertiary-container/20 text-tertiary' : ''}
              ${alerta.tipo === 'danger' ? 'bg-error-container/20 text-error' : ''}
            `}
          >
            {alerta.mensagem}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-label-md text-on-surface-variant mb-1">{titulo}</p>

      {/* Value */}
      <p className={`${valueClass} font-display font-bold text-on-surface tracking-tight mb-3`}>
        {formattedValue}
      </p>

      {/* Sparkline placeholder */}
      {showSparkline && sparkline_data && sparkline_data.length > 0 && (
        <div className="h-10 mb-3">
          <div className="w-full h-full bg-surface-container-high/50 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Trend indicator */}
      {showTrend && variacao !== undefined && (
        <div className="flex items-center gap-1.5">
          {trendIcon && (
            <span className={`material-symbols-outlined ${trendColor}`} style={{ fontSize: 16 }}>
              {trendIcon}
            </span>
          )}
          <span className={`text-label-md font-semibold ${trendColor}`}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)}%
          </span>
          {periodo_comparacao && (
            <span className="text-label-sm text-on-surface-variant/60">
              vs {periodo_comparacao}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
