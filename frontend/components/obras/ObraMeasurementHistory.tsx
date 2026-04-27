'use client';

import { useMemo } from 'react';

import type { ObraMedicao } from '@/types/obra';

interface ObraMeasurementHistoryProps {
  medicoes: ObraMedicao[];
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function ObraMeasurementHistory({
  medicoes,
}: ObraMeasurementHistoryProps) {
  const sortedMedicoes = useMemo(() => {
    return [...medicoes].sort((a, b) => {
      if (a.ano_referencia !== b.ano_referencia) {
        return a.ano_referencia - b.ano_referencia;
      }
      return a.mes_referencia - b.mes_referencia;
    });
  }, [medicoes]);

  const totalMedido = useMemo(() => {
    return sortedMedicoes.reduce((sum, m) => sum + m.valor_medicao, 0);
  }, [sortedMedicoes]);

  const medicoesComPercentual = useMemo(() => {
    let acumulado = 0;
    return sortedMedicoes.map((medicao) => {
      acumulado += medicao.valor_medicao;
      const percentual = totalMedido > 0 ? (acumulado / totalMedido) * 100 : 0;
      return { ...medicao, percentual };
    });
  }, [sortedMedicoes, totalMedido]);

  const ultimaIndex = medicoesComPercentual.length > 0 ? medicoesComPercentual.length - 1 : -1;

  if (medicoesComPercentual.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-2xl font-bold text-primary">
            Histórico de Medições
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-[48px] mb-3">
            calendar_today
          </span>
          <p className="text-body-md font-medium text-on-surface-variant">
            Nenhuma medição registrada
          </p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1">
            As medições aparecerão aqui quando forem cadastradas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline text-2xl font-bold text-primary">
          Histórico de Medições
        </h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2 text-label-md font-medium text-primary hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Baixar Planilha
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-label-md text-on-surface-variant uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Nº Medição</th>
              <th className="px-4 py-3 font-medium">Período</th>
              <th className="px-4 py-3 font-medium">% Avanço</th>
              <th className="px-4 py-3 font-medium text-right">Valor Medido</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {medicoesComPercentual.map((medicao, index) => {
              const isUltima = index === ultimaIndex;
              const bgClass = index % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low';
              return (
                <tr
                  key={`${medicao.sequencia}-${medicao.mes_referencia}-${medicao.ano_referencia}`}
                  className={bgClass}
                >
                  <td className="px-4 py-3.5 text-primary font-semibold">
                    Medição {medicao.sequencia}
                  </td>
                  <td className="px-4 py-3.5 text-on-surface">
                    {String(medicao.mes_referencia).padStart(2, '0')}/{medicao.ano_referencia}
                  </td>
                  <td className="px-4 py-3.5 text-on-surface">
                    {medicao.percentual.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-primary">
                    {formatCurrency(medicao.valor_medicao)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {isUltima ? (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-label-md font-medium bg-secondary-container text-on-secondary-container">
                        Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-label-md font-medium bg-surface-container-highest text-primary">
                        Pago
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
