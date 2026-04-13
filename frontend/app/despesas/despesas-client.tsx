'use client';

import { useState, useMemo, useCallback } from 'react';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ExpenseChart from '@/components/charts/ExpenseChart';
import { useDespesas } from '@/hooks/useFinanceData';
import type { DespesaResponse } from '@/hooks/useFinanceData';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency } from '@/lib/utils';
import { MESES } from '@/lib/constants';

const PAGE_SIZE = 15;

type ExportRow = Record<string, string | number>;

export default function DespesasClient() {
  const { anoSelecionado, setAnoSelecionado } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useDespesas({
    ano: anoSelecionado,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const { exportData, isExporting } = useExport();

  const totals = useMemo(() => {
    if (!data?.despesas) {
      return { empenhado: 0, liquidado: 0, pago: 0 };
    }
    return data.despesas.reduce(
      (acc, d) => ({
        empenhado: acc.empenhado + d.valor_empenhado,
        liquidado: acc.liquidado + d.valor_liquidado,
        pago: acc.pago + d.valor_pago,
      }),
      { empenhado: 0, liquidado: 0, pago: 0 },
    );
  }, [data?.despesas]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)),
    [data?.total],
  );

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (!data?.despesas.length) return;

      const rows: ExportRow[] = data.despesas.map((d: DespesaResponse) => ({
        Ano: d.ano,
        Mes: MESES[d.mes - 1] ?? d.mes,
        Categoria: d.categoria ?? '-',
        Tipo: d.tipo,
        Empenhado: d.valor_empenhado,
        Liquidado: d.valor_liquidado,
        Pago: d.valor_pago,
        Fonte: d.fonte,
      }));

      await exportData(rows, {
        format,
        filename: `despesas-${anoSelecionado}-${page + 1}.${format}`,
      });
    },
    [data?.despesas, anoSelecionado, page, exportData],
  );

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setAnoSelecionado(Number(e.target.value));
      setPage(0);
    },
    [setAnoSelecionado],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              Despesas Municipais
            </h1>
            <p className="text-sm text-dark-400 mt-1">
              Execução orçamentária por função
            </p>
          </div>

          <select
            value={anoSelecionado}
            onChange={handleYearChange}
            className="bg-dark-800 border border-dark-700 text-dark-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-expense-DEFAULT/50"
          >
            {anos.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Empenhado" value={totals.empenhado} />
          <SummaryCard label="Total Liquidado" value={totals.liquidado} />
          <SummaryCard label="Total Pago" value={totals.pago} />
        </div>

        {/* Chart */}
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-4">
          <ExpenseChart height={320} />
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingSpinner message="Carregando despesas..." />
        ) : isError ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400 text-sm">
              Erro ao carregar dados de despesas.
            </p>
          </div>
        ) : (
          <div className="bg-dark-900/50 border border-dark-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400">
                    <th className="px-4 py-3 text-left font-medium">Ano</th>
                    <th className="px-4 py-3 text-left font-medium">Mês</th>
                    <th className="px-4 py-3 text-left font-medium">Categoria</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Empenhado</th>
                    <th className="px-4 py-3 text-right font-medium">Liquidado</th>
                    <th className="px-4 py-3 text-right font-medium">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {data?.despesas.map((d) => (
                    <tr
                      key={`${d.ano}-${d.mes}-${d.categoria}-${d.tipo}`}
                      className="hover:bg-dark-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-dark-200">{d.ano}</td>
                      <td className="px-4 py-3 text-dark-200">
                        {MESES[d.mes - 1] ?? d.mes}
                      </td>
                      <td className="px-4 py-3 text-dark-300">
                        {d.categoria ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <TipoBadge tipo={d.tipo} />
                      </td>
                      <td className="px-4 py-3 text-right text-dark-200">
                        {formatCurrency(d.valor_empenhado, { compact: true })}
                      </td>
                      <td className="px-4 py-3 text-right text-dark-200">
                        {formatCurrency(d.valor_liquidado, { compact: true })}
                      </td>
                      <td className="px-4 py-3 text-right text-dark-200">
                        {formatCurrency(d.valor_pago, { compact: true })}
                      </td>
                    </tr>
                  ))}
                  {(!data?.despesas.length) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-dark-400"
                      >
                        Nenhum registro encontrado para {anoSelecionado}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-dark-800 px-4 py-3">
                <span className="text-xs text-dark-400">
                  Página {page + 1} de {totalPages} — {data?.total ?? 0} registros
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-xs rounded-md bg-dark-800 text-dark-200 disabled:opacity-40 hover:bg-dark-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-xs rounded-md bg-dark-800 text-dark-200 disabled:opacity-40 hover:bg-dark-700 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export */}
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting || !data?.despesas.length}
            className="px-4 py-2 text-sm rounded-lg bg-dark-800 text-dark-200 border border-dark-700 hover:bg-dark-700 disabled:opacity-40 transition-colors"
          >
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting || !data?.despesas.length}
            className="px-4 py-2 text-sm rounded-lg bg-dark-800 text-dark-200 border border-dark-700 hover:bg-dark-700 disabled:opacity-40 transition-colors"
          >
            {isExporting ? 'Exportando...' : 'Exportar JSON'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── Sub-componentes ───────────────────────────────────────────────── */

interface SummaryCardProps {
  label: string;
  value: number;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5">
      <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-expense-DEFAULT">
        {formatCurrency(value, { compact: true })}
      </p>
    </div>
  );
}

const TIPO_STYLES: Record<string, string> = {
  CORRENTE: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
  CAPITAL: 'bg-purple-900/30 text-purple-400 border-purple-800',
  CONTINGENCIA: 'bg-amber-900/30 text-amber-400 border-amber-800',
};

function TipoBadge({ tipo }: { tipo: string }) {
  const styles = TIPO_STYLES[tipo] ?? 'bg-dark-800 text-dark-300 border-dark-700';
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded-full border ${styles}`}
    >
      {tipo}
    </span>
  );
}
