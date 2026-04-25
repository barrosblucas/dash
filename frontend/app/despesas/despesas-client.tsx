'use client';

import { useState, useMemo, useCallback } from 'react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ExpenseChart from '@/components/charts/ExpenseChart';
import { useDespesas, useDespesasTotalAno } from '@/hooks/useFinanceData';
import type { DespesaResponse } from '@/hooks/useFinanceData';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { formatCurrency } from '@/lib/utils';
import { MESES } from '@/lib/constants';

import DespesaBreakdownTable from './DespesaBreakdownTable';

const PAGE_SIZE = 15;
const TIPO_OPTIONS = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'CORRENTE', label: 'Correntes' },
  { value: 'CAPITAL', label: 'Capital' },
] as const;

const TH_BASE = 'px-4 py-3 font-medium bg-surface-container-low sticky top-0';
const BTN_EXPORT = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-label-md font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors disabled:opacity-40';
const BTN_PAGE = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-label-md font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30';

type ExportRow = Record<string, string | number>;

export default function DespesasClient() {
  const { anoSelecionado, setAnoSelecionado, tipoDespesa, setTipoDespesa } = useDashboardFilters();
  const anos = useAnosDisponiveis();
  const [page, setPage] = useState(0);
  const tipoFiltro = tipoDespesa === 'TODOS' ? undefined : tipoDespesa;

  const { data, isLoading, isError } = useDespesas({
    ano: anoSelecionado, tipo: tipoFiltro, limit: PAGE_SIZE, offset: page * PAGE_SIZE,
  });
  const { data: totalAnoData } = useDespesasTotalAno(anoSelecionado);
  const { exportData, isExporting } = useExport();

  const totals = useMemo(() => {
    const empenhado = totalAnoData?.total_empenhado ?? 0;
    const liquidado = totalAnoData?.total_liquidado ?? 0;
    const pago = totalAnoData?.total_pago ?? 0;
    const execucao = empenhado > 0 ? (liquidado / empenhado) * 100 : 0;
    return { empenhado, liquidado, pago, execucao };
  }, [totalAnoData]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)),
    [data?.total],
  );

  const categoryBreakdown = useMemo(() => {
    if (!data?.despesas.length) return [];
    const map = new Map<string, { empenhado: number; liquidado: number }>();
    for (const d of data.despesas) {
      const cat = d.categoria ?? 'Outros';
      const prev = map.get(cat) ?? { empenhado: 0, liquidado: 0 };
      prev.empenhado += d.valor_empenhado;
      prev.liquidado += d.valor_liquidado;
      map.set(cat, prev);
    }
    const totalEmp = data.despesas.reduce((s, d) => s + d.valor_empenhado, 0);
    return Array.from(map.entries())
      .map(([name, vals]) => ({
        name, empenhado: vals.empenhado, liquidado: vals.liquidado,
        percent: totalEmp > 0 ? (vals.empenhado / totalEmp) * 100 : 0,
      }))
      .sort((a, b) => b.empenhado - a.empenhado);
  }, [data?.despesas]);

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (!data?.despesas.length) return;
      const rows: ExportRow[] = data.despesas.map((d: DespesaResponse) => ({
        Ano: d.ano, Mes: MESES[d.mes - 1] ?? d.mes,
        Categoria: d.categoria ?? '-', Tipo: d.tipo,
        Empenhado: d.valor_empenhado, Liquidado: d.valor_liquidado,
        Pago: d.valor_pago, Fonte: d.fonte,
      }));
      await exportData(rows, { format, filename: `despesas-${anoSelecionado}-${page + 1}.${format}` });
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

  const handleTipoChange = useCallback(
    (tipo: string) => {
      setTipoDespesa(tipo as 'TODOS' | 'CORRENTE' | 'CAPITAL');
      setPage(0);
    },
    [setTipoDespesa],
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-error/10">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '22px' }}>receipt_long</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium bg-error-container/30 text-error">
                Execução Orçamentária
              </span>
            </div>
            <h1 className="font-display font-bold text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
              Despesas Municipais
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
              Acompanhamento da execução orçamentária por função e categoria.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>calendar_today</span>
            <select value={anoSelecionado} onChange={handleYearChange} className="select-field w-auto pr-8">
              {anos.map((ano) => (<option key={ano} value={ano}>{ano}</option>))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {TIPO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTipoChange(opt.value)}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all duration-200 ${
                tipoDespesa === opt.value
                  ? 'bg-error text-on-error shadow-sm dark:bg-error dark:text-on-error'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Despesa Empenhada" value={formatCurrency(totals.empenhado, { compact: true })} icon="bookmark_added" accent="error" />
        <KpiCard label="Despesa Liquidada" value={formatCurrency(totals.liquidado, { compact: true })} icon="check_circle" accent="error" />
        <KpiCard label="% Execução" value={totals.execucao.toFixed(1) + '%'} icon="percent" accent={totals.execucao >= 90 ? 'secondary' : totals.execucao >= 70 ? 'tertiary' : 'error'} />
        <KpiCard label="Total Pago" value={formatCurrency(totals.pago, { compact: true })} icon="payments" accent="error" />
      </section>

      {/* Main Chart */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <ExpenseChart height={360} />
      </section>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>donut_small</span>
            <h3 className="text-title-md font-display text-on-surface">Top Categorias</h3>
          </div>
          <div className="space-y-3">
            {categoryBreakdown.slice(0, 6).map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-sm font-medium text-on-surface truncate mr-4">{cat.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-label-md text-on-surface-variant">
                      {formatCurrency(cat.empenhado, { compact: true })}
                    </span>
                    <span className="text-label-md font-medium text-error w-12 text-right">
                      {cat.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full rounded-full bg-error/70 transition-all duration-500" style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient">
        {isLoading ? (
          <div className="p-6 py-16 flex flex-col items-center gap-3">
            <LoadingSpinner message="Carregando despesas..." />
          </div>
        ) : isError ? (
          <div className="p-6 py-16 text-center">
            <span className="material-symbols-outlined text-error mb-3 block mx-auto" style={{ fontSize: '40px' }}>error</span>
            <p className="text-body-md text-error">Erro ao carregar dados de despesas.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>table_chart</span>
                <div>
                  <h3 className="text-title-md font-display text-on-surface">Detalhamento</h3>
                  <p className="text-label-md text-on-surface-variant mt-0.5">{data?.total ?? 0} registros no período</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleExport('csv')} disabled={isExporting || !data?.despesas.length} className={BTN_EXPORT}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> CSV
                </button>
                <button onClick={() => handleExport('json')} disabled={isExporting || !data?.despesas.length} className={BTN_EXPORT}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>code</span> JSON
                </button>
              </div>
            </div>

            <div className="p-6 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                      <th className={`${TH_BASE} text-left`}>Ano</th>
                      <th className={`${TH_BASE} text-left`}>Mês</th>
                      <th className={`${TH_BASE} text-left`}>Categoria</th>
                      <th className={`${TH_BASE} text-left`}>Tipo</th>
                      <th className={`${TH_BASE} text-right`}>Empenhado</th>
                      <th className={`${TH_BASE} text-right`}>Liquidado</th>
                      <th className={`${TH_BASE} text-right`}>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.despesas.map((d, i) => (
                      <tr
                        key={`${d.ano}-${d.mes}-${d.categoria}-${d.tipo}`}
                        className={`transition-colors duration-150 hover:bg-surface-container ${
                          i % 2 === 1 ? 'bg-surface-container-low/50' : 'bg-surface-container-lowest'
                        }`}
                      >
                        <td className="px-4 py-3 text-on-surface font-mono">{d.ano}</td>
                        <td className="px-4 py-3 text-on-surface">{MESES[d.mes - 1] ?? d.mes}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{d.categoria ?? '-'}</td>
                        <td className="px-4 py-3"><TipoBadge tipo={d.tipo} /></td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium font-mono">{formatCurrency(d.valor_empenhado, { compact: true })}</td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium font-mono">{formatCurrency(d.valor_liquidado, { compact: true })}</td>
                        <td className="px-4 py-3 text-right text-on-surface font-medium font-mono">{formatCurrency(d.valor_pago, { compact: true })}</td>
                      </tr>
                    ))}
                    {(!data?.despesas.length) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined opacity-40 mb-2 block mx-auto" style={{ fontSize: '32px' }}>search_off</span>
                          Nenhum registro encontrado para {anoSelecionado}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4">
                  <span className="text-label-md text-on-surface-variant">
                    Página {page + 1} de {totalPages} — {data?.total ?? 0} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={BTN_PAGE}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span> Anterior
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className={BTN_PAGE}>
                      Próxima <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Breakdown Section */}
      <DespesaBreakdownTable ano={anoSelecionado} />
    </div>
  );
}

/* ─── Sub-components ─── */

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  accent: 'error' | 'secondary' | 'tertiary';
}

const ACCENT_MAP = {
  error: { iconBg: 'bg-error/10', iconText: 'text-error', valueText: 'text-error' },
  secondary: { iconBg: 'bg-secondary/10', iconText: 'text-secondary', valueText: 'text-secondary' },
  tertiary: { iconBg: 'bg-tertiary/10', iconText: 'text-tertiary', valueText: 'text-tertiary' },
};

function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  const c = ACCENT_MAP[accent];
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient transition-shadow duration-300 hover:shadow-ambient-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${c.iconBg}`}>
          <span className={`material-symbols-outlined ${c.iconText}`} style={{ fontSize: '20px' }}>{icon}</span>
        </div>
        <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-headline-lg sm:text-display-sm font-display font-bold tracking-tight ${c.valueText}`}>{value}</p>
    </div>
  );
}

const TIPO_STYLES: Record<string, string> = {
  CORRENTE: 'bg-secondary-container/20 text-on-secondary-container',
  CAPITAL: 'bg-primary-container/20 text-primary dark:bg-primary-300/20 dark:text-primary-100',
  CONTINGENCIA: 'bg-tertiary-container/20 text-on-tertiary-container',
};

function TipoBadge({ tipo }: { tipo: string }) {
  const styles = TIPO_STYLES[tipo] ?? 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-md font-medium ${styles}`}>{tipo}</span>
  );
}
