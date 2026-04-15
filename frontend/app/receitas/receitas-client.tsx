'use client';

import { useMemo } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useReceitasDetalhamento, useReceitasTotalAno } from '@/hooks/useFinanceData';
import type { ReceitaDetalhamento } from '@/types/receita';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { COLORS } from '@/lib/constants';
import ReceitaDetalhamentoTable from '@/components/receitas/ReceitaDetalhamentoTable';

const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export default function ReceitasClient() {
  const { anoSelecionado, setAnoSelecionado, tipoReceita, setTipoReceita } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const { exportData, isExporting } = useExport();
  const tipoParaTotalAnual = tipoReceita === 'TODOS' ? undefined : tipoReceita;

  const { data: detalhamentoData, isLoading: isLoadingDetalhamento } =
    useReceitasDetalhamento(anoSelecionado);
  const { data: totalAnoData } = useReceitasTotalAno(anoSelecionado, tipoParaTotalAnual);

  const itens = useMemo(() => {
    if (!detalhamentoData?.itens) return [];
    if (tipoReceita === 'TODOS') return detalhamentoData.itens;
    return detalhamentoData.itens.filter((i) => i.tipo === tipoReceita);
  }, [detalhamentoData, tipoReceita]);

  const summary = useMemo(() => {
    const topLevelItens = (detalhamentoData?.itens ?? []).filter((item) => item.nivel === 1);

    const previstoCorrentePrincipal = topLevelItens
      .filter((item) => item.tipo === 'CORRENTE' && !isDeducao(item.detalhamento))
      .reduce((sum, item) => sum + item.valor_previsto, 0);

    const previstoCapital = topLevelItens
      .filter((item) => item.tipo === 'CAPITAL')
      .reduce((sum, item) => sum + item.valor_previsto, 0);

    const arrecadadoAno = totalAnoData?.total_arrecadado ?? 0;
    const arrecadadoCapital = topLevelItens
      .filter((item) => item.tipo === 'CAPITAL')
      .reduce((sum, item) => sum + (item.valor_arrecadado - item.valor_anulado), 0);

    const arrecadado = tipoReceita === 'CAPITAL' ? arrecadadoCapital : arrecadadoAno;
    const previsto = tipoReceita === 'CAPITAL' ? previstoCapital : previstoCorrentePrincipal;
    const execucao = previsto > 0 ? (arrecadado / previsto) * 100 : 0;

    return { arrecadado, previsto, execucao };
  }, [detalhamentoData, tipoReceita, totalAnoData]);

  const handleExport = async (format: 'csv' | 'json') => {
    const exportRows = itens.map((r: ReceitaDetalhamento) => ({
      Detalhamento: r.detalhamento,
      Nivel: r.nivel,
      Tipo: r.tipo,
      Previsto: r.valor_previsto,
      Arrecadado: r.valor_arrecadado,
      Anulado: r.valor_anulado,
      Fonte: r.fonte,
    }));
    await exportData(exportRows, {
      format,
      filename: `receitas-detalhamento-${anoSelecionado}.${format}`,
    });
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
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
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
                setTipoReceita(e.target.value as 'TODOS' | 'CORRENTE' | 'CAPITAL');
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

        {/* Tabela hierárquica de detalhamento */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-200">
              Detalhamento Hierárquico
              {detalhamentoData && (
                <span className="ml-2 text-xs text-dark-400 font-normal">
                  ({detalhamentoData.total_itens} itens)
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting || itens.length === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dark-700 text-dark-300
                           hover:bg-dark-600 hover:text-dark-100 transition-colors disabled:opacity-40"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || itens.length === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dark-700 text-dark-300
                           hover:bg-dark-600 hover:text-dark-100 transition-colors disabled:opacity-40"
              >
                JSON
              </button>
            </div>
          </div>

          {isLoadingDetalhamento ? (
            <div className="py-12">
              <LoadingSpinner message="Carregando detalhamento..." />
            </div>
          ) : itens.length === 0 ? (
            <div className="py-12 text-center text-dark-400 text-sm">
              Nenhum registro encontrado para o filtro selecionado.
            </div>
          ) : (
            <ReceitaDetalhamentoTable itens={itens} />
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

function isDeducao(detalhamento: string): boolean {
  const normalized = detalhamento.trim().toUpperCase();
  return normalized.startsWith('(-)') || normalized.includes('DEDU');
}
