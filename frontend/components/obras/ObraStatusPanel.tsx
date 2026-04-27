'use client';

import { useMemo } from 'react';

import type { ObraMedicao } from '@/types/obra';

interface ObraStatusPanelProps {
  progressoFisico: number | null;
  progressoFinanceiro: number | null;
  valorOriginal: number | null;
  valorHomologado: number | null;
  valorMedidoTotal: number;
  medicoes: ObraMedicao[];
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export default function ObraStatusPanel({
  progressoFisico,
  progressoFinanceiro,
  valorOriginal,
  valorHomologado,
  valorMedidoTotal,
  medicoes,
}: ObraStatusPanelProps) {
  const ultimaMedicao = useMemo(() => {
    if (medicoes.length === 0) return null;
    return [...medicoes].sort((a, b) => {
      if (a.ano_referencia !== b.ano_referencia) {
        return b.ano_referencia - a.ano_referencia;
      }
      return b.mes_referencia - a.mes_referencia;
    })[0];
  }, [medicoes]);

  const ultimaMedicaoTexto = ultimaMedicao
    ? `${String(ultimaMedicao.mes_referencia).padStart(2, '0')}/${ultimaMedicao.ano_referencia}`
    : null;

  const progressoFisicoNum = progressoFisico ?? 0;
  const progressoFinanceiroNum = progressoFinanceiro ?? 0;
  const atraso =
    progressoFisico !== null && progressoFinanceiro !== null
      ? Math.abs(progressoFinanceiroNum - progressoFisicoNum)
      : null;

  const valorPrevisto = valorHomologado ?? valorOriginal;

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Status Atual */}
      <div className="bg-surface-container-low rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary">trending_up</span>
          <h3 className="text-title-md font-headline font-semibold text-primary">Status Atual</h3>
        </div>

        <p className="font-headline text-4xl font-extrabold text-primary">
          {formatPercent(progressoFisico)}
        </p>

        <p className="mt-2 text-body-sm text-on-surface-variant">
          {ultimaMedicaoTexto
            ? `Concluído até ${ultimaMedicaoTexto}`
            : 'Status atual'}
        </p>

        {/* Barra de progresso visual */}
        <div className="mt-5">
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progressoFisicoNum))}%` }}
            />
          </div>
        </div>

        {/* Barra de atraso estimado */}
        {atraso !== null && atraso > 0.5 && (
          <div className="mt-4">
            <p className="text-label-md text-error mb-1.5">Atraso estimado</p>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-error rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, atraso))}%` }}
              />
            </div>
            <p className="mt-1 text-label-sm text-error">{atraso.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Card 2: Valor */}
      <div className="relative bg-primary text-on-primary rounded-3xl p-6 overflow-hidden">
        <div className="relative z-10">
          <p className="text-label-md font-medium text-primary-fixed-dim">
            Valor Total Empenhado
          </p>
          <p className="mt-2 font-headline text-3xl font-extrabold">
            {formatCurrency(valorMedidoTotal)}
          </p>
          <p className="mt-2 text-body-sm text-on-primary/80">
            {valorPrevisto !== null && valorPrevisto > 0
              ? `de ${formatCurrency(valorPrevisto)} previstos`
              : 'Empenhado até o momento'}
          </p>
        </div>

        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-primary-container/50 text-[120px] select-none pointer-events-none">
          account_balance_wallet
        </span>
      </div>
    </div>
  );
}
