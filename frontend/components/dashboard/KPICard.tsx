'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import type { KPICardData } from '@/types';

interface KPICardProps {
  data: KPICardData;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  showTrend?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function KPICard({
  data,
  size = 'md',
  showSparkline = false,
  showTrend = true,
  animated = true,
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
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  // Cor da variação
  const variacaoColor = (() => {
    if (!variacao) return 'text-dark-400';
    if (variacao_tipo === 'positiva') return 'text-revenue-accent';
    if (variacao_tipo === 'negativa') return 'text-expense-accent';
    return 'text-dark-400';
  })();

  // Ícone da variação
  const VariacaoIcon = (() => {
    if (!variacao) return null;
    if (tendencia === 'alta') return ArrowUpRight;
    if (tendencia === 'baixa') return ArrowDownRight;
    return Minus;
  })();

  return (
    <div
      className={`
        glass-card ${sizeClasses[size]} transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-dark-600 hover:shadow-card-hover' : ''}
        ${animated ? 'animate-fade-in-up' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="metric-label">{titulo}</h3>
        {alerta && (
          <span
            className={`
              badge
              ${alerta.tipo === 'info' ? 'badge-info' : ''}
              ${alerta.tipo === 'warning' ? 'badge-warning' : ''}
              ${alerta.tipo === 'danger' ? 'badge-danger' : ''}
            `}
          >
            {alerta.mensagem}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className={`metric-value ${valueSizeClasses[size]} font-display text-dark-100`}>
          {formattedValue}
        </p>
      </div>

      {/* Sparkline */}
      {showSparkline && sparkline_data && sparkline_data.length > 0 && (
        <div className="h-12 mb-2">
          {/* TODO: Implementar minichart sparkline */}
          <div className="w-full h-full bg-dark-800/50 rounded animate-pulse" />
        </div>
      )}

      {/* Variation */}
      {showTrend && variacao !== undefined && (
        <div className="flex items-center gap-2">
          {VariacaoIcon && (
            <VariacaoIcon
              className={`w-4 h-4 ${variacaoColor}`}
            />
          )}
          <span className={`text-sm font-medium ${variacaoColor}`}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)}%
          </span>
          {periodo_comparacao && (
            <span className="text-xs text-dark-500">
              vs {periodo_comparacao}
            </span>
          )}
        </div>
      )}
    </div>
  );
}