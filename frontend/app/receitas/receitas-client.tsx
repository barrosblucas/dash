'use client';

import { useMemo } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

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
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header monumental */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary-container/30">
                <Icon name="account_balance_wallet" className="text-secondary" size={22} />
              </div>
              <span className="chip-secondary">Arrecadação Municipal</span>
            </div>
            <h1 className="font-display text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
              Receitas
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
              Arrecadação por fonte e categoria. Acompanhe a execução orçamentária em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className="select-field pl-9 pr-8"
              >
                {anos.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <select
                value={tipoReceita}
                onChange={(e) => {
                  setTipoReceita(e.target.value as 'TODOS' | 'CORRENTE' | 'CAPITAL');
                }}
                className="select-field pl-9 pr-8"
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="CORRENTE">Corrente</option>
                <option value="CAPITAL">Capital</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Cards de resumo */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Arrecadado"
            value={formatCurrency(summary.arrecadado, { compact: true })}
            accentColor="text-secondary"
            iconName="trending_up"
            iconBg="bg-secondary-container/20"
          />
          <KpiCard
            label="Total Previsto"
            value={formatCurrency(summary.previsto, { compact: true })}
            accentColor="text-tertiary"
            iconName="target"
            iconBg="bg-tertiary-container/20"
          />
          <KpiCard
            label="% Execução"
            value={formatPercent(summary.execucao)}
            accentColor={summary.execucao >= 90 ? 'text-secondary' : summary.execucao >= 70 ? 'text-tertiary' : 'text-error'}
            iconName="percent"
            iconBg={summary.execucao >= 90 ? 'bg-secondary-container/20' : summary.execucao >= 70 ? 'bg-tertiary-container/20' : 'bg-error-container/20'}
          />
        </motion.div>

        {/* Gráfico de receitas */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<LoadingSpinner />}>
            <RevenueChart />
          </Suspense>
        </motion.div>

        {/* Tabela hierárquica de detalhamento */}
        <motion.div variants={itemVariants} className="chart-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <Icon name="table_chart" className="text-on-surface-variant" size={20} />
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
                className="btn-outline text-xs px-4 py-2"
              >
                <Icon name="download" size={16} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || itens.length === 0}
                className="btn-outline text-xs px-4 py-2"
              >
                <Icon name="code" size={16} />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {isLoadingDetalhamento ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <LoadingSpinner message="Carregando detalhamento..." />
            </div>
          ) : itens.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="search_off" className="text-on-surface-variant/40 mx-auto mb-3" size={40} />
              <p className="text-body-md text-on-surface-variant">
                Nenhum registro encontrado para o filtro selecionado.
              </p>
            </div>
          ) : (
            <ReceitaDetalhamentoTable itens={itens} />
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ─── Sub-componentes ───────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: string;
  accentColor: string;
  iconName: string;
  iconBg: string;
}

function KpiCard({ label, value, accentColor, iconName, iconBg }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
          <Icon name={iconName} className={accentColor} size={20} />
        </div>
        <span className="kpi-label">{label}</span>
      </div>
      <p className={`kpi-value ${accentColor}`}>{value}</p>
    </div>
  );
}

function isDeducao(detalhamento: string): boolean {
  const normalized = detalhamento.trim().toUpperCase();
  return normalized.startsWith('(-)') || normalized.includes('DEDU');
}
