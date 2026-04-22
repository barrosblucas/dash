'use client';

import { useMemo } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useReceitasDetalhamento, useReceitasTotalAno } from '@/hooks/useFinanceData';
import type { ReceitaDetalhamento } from '@/types/receita';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency, formatPercent } from '@/lib/utils';
import ReceitaDetalhamentoTable from '@/components/receitas/ReceitaDetalhamentoTable';

const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

/* ── Filter pill options ── */
const TIPO_OPTIONS = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'CORRENTE', label: 'Correntes' },
  { value: 'CAPITAL', label: 'Capital' },
] as const;

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

    const totalAnulado = topLevelItens
      .reduce((sum, item) => sum + item.valor_anulado, 0);
    const liquido = arrecadado - totalAnulado;

    return { arrecadado, previsto, execucao, liquido };
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
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page Header ── */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '22px' }}>
                  account_balance_wallet
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium bg-secondary-container/30 text-on-secondary-container">
                Arrecadação Municipal
              </span>
            </div>
            <h1 className="font-display font-bold text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
              Receitas Municipais
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
              Arrecadação por fonte e categoria. Acompanhe a execução orçamentária em tempo real.
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>
              calendar_today
            </span>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="select-field w-auto pr-8"
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {TIPO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTipoReceita(opt.value as 'TODOS' | 'CORRENTE' | 'CAPITAL')}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all duration-200
                ${tipoReceita === opt.value
                  ? 'bg-secondary text-on-secondary shadow-sm dark:bg-secondary dark:text-on-secondary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── KPI Row ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Receita Prevista"
          value={formatCurrency(summary.previsto, { compact: true })}
          icon="target"
          accent="secondary"
        />
        <KpiCard
          label="Receita Arrecadada"
          value={formatCurrency(summary.arrecadado, { compact: true })}
          icon="trending_up"
          accent="secondary"
        />
        <KpiCard
          label="% Execução"
          value={formatPercent(summary.execucao)}
          icon="percent"
          accent={summary.execucao >= 90 ? 'secondary' : summary.execucao >= 70 ? 'tertiary' : 'error'}
        />
        <KpiCard
          label="Receita Líquida"
          value={formatCurrency(summary.liquido, { compact: true })}
          icon="savings"
          accent="secondary"
        />
      </section>

      {/* ── Main Chart ── */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <Suspense fallback={<LoadingSpinner />}>
          <RevenueChart />
        </Suspense>
      </section>

      {/* ── Detail Table ── */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>
              table_chart
            </span>
            <div>
              <h3 className="text-title-md font-display text-on-surface">
                Detalhamento Hierárquico
              </h3>
              {detalhamentoData && (
                <p className="text-label-md text-on-surface-variant mt-0.5">
                  {detalhamentoData.total_itens} itens registrados
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting || itens.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                         text-label-md font-medium text-on-surface-variant
                         bg-surface-container-low
                         hover:bg-surface-container
                         transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting || itens.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                         text-label-md font-medium text-on-surface-variant
                         bg-surface-container-low
                         hover:bg-surface-container
                         transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>code</span>
              JSON
            </button>
          </div>
        </div>

        <div className="p-6 pt-4">
          {isLoadingDetalhamento ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <LoadingSpinner message="Carregando detalhamento..." />
            </div>
          ) : itens.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/40 mb-3 block mx-auto" style={{ fontSize: '40px' }}>
                search_off
              </span>
              <p className="text-body-md text-on-surface-variant">
                Nenhum registro encontrado para o filtro selecionado.
              </p>
            </div>
          ) : (
            <ReceitaDetalhamentoTable itens={itens} />
          )}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  accent: 'secondary' | 'tertiary' | 'error';
}

const ACCENT_MAP = {
  secondary: {
    iconBg: 'bg-secondary/10',
    iconText: 'text-secondary',
    valueText: 'text-secondary',
  },
  tertiary: {
    iconBg: 'bg-tertiary/10',
    iconText: 'text-tertiary',
    valueText: 'text-tertiary',
  },
  error: {
    iconBg: 'bg-error/10',
    iconText: 'text-error',
    valueText: 'text-error',
  },
};

function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  const colors = ACCENT_MAP[accent];
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient
                    transition-shadow duration-300 hover:shadow-ambient-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${colors.iconBg}`}>
          <span className={`material-symbols-outlined ${colors.iconText}`} style={{ fontSize: '20px' }}>
            {icon}
          </span>
        </div>
        <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-headline-lg sm:text-display-sm font-display font-bold tracking-tight ${colors.valueText}`}>
        {value}
      </p>
    </div>
  );
}

function isDeducao(detalhamento: string): boolean {
  const normalized = detalhamento.trim().toUpperCase();
  return normalized.startsWith('(-)') || normalized.includes('DEDU');
}
