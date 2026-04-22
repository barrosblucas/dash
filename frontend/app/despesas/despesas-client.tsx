'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import ExpenseChart from '@/components/charts/ExpenseChart';
import { useDespesas, useDespesasTotalAno } from '@/hooks/useFinanceData';
import type { DespesaResponse } from '@/hooks/useFinanceData';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency } from '@/lib/utils';
import { MESES } from '@/lib/constants';

const PAGE_SIZE = 15;

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
  const { data: totalAnoData } = useDespesasTotalAno(anoSelecionado);

  const { exportData, isExporting } = useExport();

  const totals = useMemo(() => {
    return {
      empenhado: totalAnoData?.total_empenhado ?? 0,
      liquidado: totalAnoData?.total_liquidado ?? 0,
      pago: totalAnoData?.total_pago ?? 0,
    };
  }, [totalAnoData]);

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
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-error-container/20">
                <Icon name="receipt_long" className="text-error" size={22} />
              </div>
              <span className="chip-error">Execução Orçamentária</span>
            </div>
            <h1 className="font-display text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
              Despesas
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
              Acompanhamento da execução orçamentária por função e categoria.
            </p>
          </div>

          <div className="relative">
            <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <select
              value={anoSelecionado}
              onChange={handleYearChange}
              className="select-field pl-9 pr-8"
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Empenhado"
            value={formatCurrency(totals.empenhado, { compact: true })}
            accentColor="text-expense"
            iconName="bookmark_added"
            iconBg="bg-error-container/20"
          />
          <KpiCard
            label="Total Liquidado"
            value={formatCurrency(totals.liquidado, { compact: true })}
            accentColor="text-tertiary"
            iconName="check_circle"
            iconBg="bg-tertiary-container/20"
          />
          <KpiCard
            label="Total Pago"
            value={formatCurrency(totals.pago, { compact: true })}
            accentColor="text-secondary"
            iconName="payments"
            iconBg="bg-secondary-container/20"
          />
        </motion.div>

        {/* Chart */}
        <motion.div variants={itemVariants}>
          <ExpenseChart height={360} />
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="chart-container py-16 flex flex-col items-center gap-3">
              <LoadingSpinner message="Carregando despesas..." />
            </div>
          ) : isError ? (
            <div className="chart-container py-16 text-center">
              <Icon name="error" className="text-error mx-auto mb-3" size={40} />
              <p className="text-body-md text-error">Erro ao carregar dados de despesas.</p>
            </div>
          ) : (
            <div className="chart-container">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <Icon name="table_chart" className="text-on-surface-variant" size={20} />
                  <div>
                    <h3 className="text-title-md font-display text-on-surface">
                      Detalhamento
                    </h3>
                    <p className="text-label-md text-on-surface-variant mt-0.5">
                      {data?.total ?? 0} registros no período
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting || !data?.despesas.length}
                    className="btn-outline text-xs px-4 py-2"
                  >
                    <Icon name="download" size={16} />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={isExporting || !data?.despesas.length}
                    className="btn-outline text-xs px-4 py-2"
                  >
                    <Icon name="code" size={16} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Ano</th>
                      <th className="px-4 py-3 text-left">Mês</th>
                      <th className="px-4 py-3 text-left">Categoria</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-right">Empenhado</th>
                      <th className="px-4 py-3 text-right">Liquidado</th>
                      <th className="px-4 py-3 text-right">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.despesas.map((d) => (
                      <tr key={`${d.ano}-${d.mes}-${d.categoria}-${d.tipo}`}>
                        <td className="px-4 py-3 text-on-surface">{d.ano}</td>
                        <td className="px-4 py-3 text-on-surface">
                          {MESES[d.mes - 1] ?? d.mes}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {d.categoria ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <TipoBadge tipo={d.tipo} />
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium">
                          {formatCurrency(d.valor_empenhado, { compact: true })}
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium">
                          {formatCurrency(d.valor_liquidado, { compact: true })}
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium">
                          {formatCurrency(d.valor_pago, { compact: true })}
                        </td>
                      </tr>
                    ))}
                    {(!data?.despesas.length) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-on-surface-variant"
                        >
                          <Icon name="search_off" className="mx-auto mb-2 opacity-40" size={32} />
                          Nenhum registro encontrado para {anoSelecionado}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4">
                  <span className="text-label-md text-on-surface-variant">
                    Página {page + 1} de {totalPages} — {data?.total ?? 0} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="btn-ghost text-xs px-3 py-2 disabled:opacity-30"
                    >
                      <Icon name="chevron_left" size={16} />
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="btn-ghost text-xs px-3 py-2 disabled:opacity-30"
                    >
                      Próxima
                      <Icon name="chevron_right" size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
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

const TIPO_STYLES: Record<string, string> = {
  CORRENTE: 'bg-secondary-container/20 text-on-secondary-container',
  CAPITAL: 'bg-primary-container/20 text-primary',
  CONTINGENCIA: 'bg-tertiary-container/20 text-on-tertiary-container',
};

function TipoBadge({ tipo }: { tipo: string }) {
  const styles = TIPO_STYLES[tipo] ?? 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-md font-medium ${styles}`}>
      {tipo}
    </span>
  );
}
