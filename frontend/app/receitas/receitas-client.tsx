'use client';

import { useState, useMemo } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useReceitas, useReceitasCategorias } from '@/hooks/useFinanceData';
import type { ReceitaResponse } from '@/hooks/useFinanceData';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { MESES, COLORS } from '@/lib/constants';

const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const PAGE_SIZE = 15;

export default function ReceitasClient() {
  const { anoSelecionado, setAnoSelecionado, tipoReceita, setTipoReceita } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const [page, setPage] = useState(0);
  const { exportData, isExporting } = useExport();

  const offset = page * PAGE_SIZE;

  const params = useMemo(() => ({
    ano: anoSelecionado,
    tipo: tipoReceita === 'TODOS' ? undefined : tipoReceita,
    limit: PAGE_SIZE,
    offset,
  }), [anoSelecionado, tipoReceita, offset]);

  const { data, isLoading, error } = useReceitas(params);
  const receitas = data?.receitas ?? [];

  const summary = useMemo(() => {
    if (receitas.length === 0) return { arrecadado: 0, previsto: 0, execucao: 0 };
    const arrecadado = receitas.reduce((s, r) => s + r.valor_arrecadado, 0);
    const previsto = receitas.reduce((s, r) => s + r.valor_previsto, 0);
    const execucao = previsto > 0 ? (arrecadado / previsto) * 100 : 0;
    return { arrecadado, previsto, execucao };
  }, [receitas]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleExport = async (format: 'csv' | 'json') => {
    const exportRows = receitas.map((r: ReceitaResponse) => ({
      Ano: r.ano,
      Mes: MESES[r.mes - 1] ?? r.mes,
      Categoria: r.categoria,
      Tipo: r.tipo,
      Previsto: r.valor_previsto,
      Arrecadado: r.valor_arrecadado,
      Anulado: r.valor_anulado,
      Fonte: r.fonte,
    }));
    await exportData(exportRows, { format, filename: `receitas-${anoSelecionado}.${format}` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Receitas Municipais</h1>
            <p className="text-sm text-dark-400">Arrecadação por fonte e categoria</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={anoSelecionado}
              onChange={(e) => { setAnoSelecionado(Number(e.target.value)); setPage(0); }}
              className="bg-dark-800 border border-dark-700 text-dark-200 rounded-lg px-3 py-2 text-sm
                         focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>

            <select
              value={tipoReceita}
              onChange={(e) => {
                const v = e.target.value as 'TODOS' | 'CORRENTE' | 'CAPITAL';
                setTipoReceita(v);
                setPage(0);
              }}
              className="bg-dark-800 border border-dark-700 text-dark-200 rounded-lg px-3 py-2 text-sm
                         focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="CORRENTE">Corrente</option>
              <option value="CAPITAL">Capital</option>
            </select>
          </div>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Arrecadado"
            value={formatCurrency(summary.arrecadado, { compact: true })}
            accent={COLORS.revenue.accent}
          />
          <SummaryCard
            label="Total Previsto"
            value={formatCurrency(summary.previsto, { compact: true })}
            accent={COLORS.forecast.accent}
          />
          <SummaryCard
            label="% Execução"
            value={formatPercent(summary.execucao)}
            accent={summary.execucao >= 90 ? COLORS.status.success : COLORS.status.warning}
          />
        </div>

        {/* Gráfico de receitas */}
        <Suspense fallback={<LoadingSpinner />}>
          <RevenueChart />
        </Suspense>

        {/* Tabela de dados */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-200">Detalhamento por registro</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting || receitas.length === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dark-700 text-dark-300
                           hover:bg-dark-600 hover:text-dark-100 transition-colors disabled:opacity-40"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || receitas.length === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dark-700 text-dark-300
                           hover:bg-dark-600 hover:text-dark-100 transition-colors disabled:opacity-40"
              >
                JSON
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner message="Carregando receitas..." />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400 text-sm">
              Erro ao carregar dados. Tente novamente.
            </div>
          ) : receitas.length === 0 ? (
            <div className="py-12 text-center text-dark-400 text-sm">
              Nenhum registro encontrado para o filtro selecionado.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700/50 text-dark-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-medium">Ano</th>
                      <th className="px-4 py-3 text-left font-medium">Mês</th>
                      <th className="px-4 py-3 text-left font-medium">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium">Previsto</th>
                      <th className="px-4 py-3 text-right font-medium">Arrecadado</th>
                      <th className="px-4 py-3 text-right font-medium">Anulado</th>
                      <th className="px-4 py-3 text-right font-medium">% Exec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitas.map((r, idx) => {
                      const execPct = r.valor_previsto > 0
                        ? (r.valor_arrecadado / r.valor_previsto) * 100
                        : 0;
                      const rowBg = idx % 2 === 0 ? 'bg-dark-800/30' : 'bg-dark-800/10';
                      return (
                        <tr key={`${r.ano}-${r.mes}-${r.categoria}-${idx}`} className={`${rowBg} hover:bg-dark-700/30 transition-colors`}>
                          <td className="px-4 py-2.5 text-dark-200">{r.ano}</td>
                          <td className="px-4 py-2.5 text-dark-200">{MESES[r.mes - 1] ?? r.mes}</td>
                          <td className="px-4 py-2.5 text-dark-200 max-w-[200px] truncate">{r.categoria}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              r.tipo === 'CORRENTE'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {r.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-dark-300">{formatCurrency(r.valor_previsto)}</td>
                          <td className="px-4 py-2.5 text-right text-dark-100 font-medium">{formatCurrency(r.valor_arrecadado)}</td>
                          <td className="px-4 py-2.5 text-right text-dark-400">{formatCurrency(r.valor_anulado)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={execPct >= 90 ? 'text-emerald-400' : execPct >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                              {formatPercent(execPct)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-dark-700/50 flex items-center justify-between text-sm text-dark-400">
                  <span>
                    Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, data?.total ?? 0)} de {data?.total ?? 0}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 rounded bg-dark-700 hover:bg-dark-600 disabled:opacity-30 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!data?.has_next}
                      className="px-3 py-1 rounded bg-dark-700 hover:bg-dark-600 disabled:opacity-30 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Card de resumo reutilizável */
interface SummaryCardProps {
  label: string;
  value: string;
  accent: string;
}

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-4">
      <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  );
}
