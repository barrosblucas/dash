'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { useReceitas, useDespesas, useKPIs } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/utils';

// --- Tipos ---

type ExportFormat = 'csv' | 'json';
type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ExportState {
  status: ExportStatus;
  message: string;
}

interface ExportCardConfig {
  id: string;
  iconName: string;
  title: string;
  description: string;
  formats: ExportFormat[];
  colorClass: string;
  iconBgClass: string;
  filename: string;
}

// --- Card configurations ---

const EXPORT_CARDS: ExportCardConfig[] = [
  {
    id: 'receitas',
    iconName: 'trending_up',
    title: 'Relatório de Receitas',
    description: 'Dados de arrecadação municipal completa',
    formats: ['csv', 'json'],
    colorClass: 'text-secondary',
    iconBgClass: 'bg-secondary-container/20',
    filename: 'receitas',
  },
  {
    id: 'despesas',
    iconName: 'trending_down',
    title: 'Relatório de Despesas',
    description: 'Dados de execução orçamentária detalhada',
    formats: ['csv', 'json'],
    colorClass: 'text-error',
    iconBgClass: 'bg-error-container/20',
    filename: 'despesas',
  },
  {
    id: 'balanco',
    iconName: 'account_balance',
    title: 'Balanço Anual',
    description: 'Resumo consolidado do exercício financeiro',
    formats: ['json'],
    colorClass: 'text-primary',
    iconBgClass: 'bg-primary/10',
    filename: 'balanco',
  },
  {
    id: 'dados-abertos',
    iconName: 'public',
    title: 'Dados Abertos',
    description: 'Dataset completo para análise externa',
    formats: ['csv'],
    colorClass: 'text-tertiary',
    iconBgClass: 'bg-tertiary-container/20',
    filename: 'dados-abertos',
  },
  {
    id: 'previsoes',
    iconName: 'query_stats',
    title: 'Previsões',
    description: 'Projeções financeiras exportáveis',
    formats: ['csv'],
    colorClass: 'text-tertiary',
    iconBgClass: 'bg-tertiary-container/20',
    filename: 'previsoes',
  },
  {
    id: 'kpis',
    iconName: 'bar_chart',
    title: 'Comparativo KPIs',
    description: 'Indicadores financeiros consolidados',
    formats: ['csv', 'json'],
    colorClass: 'text-secondary',
    iconBgClass: 'bg-secondary-container/20',
    filename: 'kpis-consolidados',
  },
];

// --- Animações ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// --- Componente principal ---

export default function RelatoriosClient() {
  const { anoSelecionado, setAnoSelecionado } = useDashboardFilters();
  const anosDisponiveis = useAnosDisponiveis();
  const { exportData, isExporting } = useExport();

  const [exportStates, setExportStates] = useState<Record<string, ExportState>>({
    receitas: { status: 'idle', message: '' },
    despesas: { status: 'idle', message: '' },
    balanco: { status: 'idle', message: '' },
    'dados-abertos': { status: 'idle', message: '' },
    previsoes: { status: 'idle', message: '' },
    kpis: { status: 'idle', message: '' },
  });

  const { data: receitasData } = useReceitas({ ano: anoSelecionado, limit: 10000 });
  const { data: despesasData } = useDespesas({ ano: anoSelecionado, limit: 10000 });
  const { data: kpisData } = useKPIs(anoSelecionado);

  const updateExportState = useCallback((cardId: string, state: ExportState) => {
    setExportStates((prev) => ({ ...prev, [cardId]: state }));
  }, []);

  const handleExport = useCallback(
    async (cardId: string, format: ExportFormat) => {
      updateExportState(cardId, { status: 'loading', message: '' });

      const config = EXPORT_CARDS.find((c) => c.id === cardId);
      if (!config) return;

      try {
        let records: Record<string, unknown>[];

        if (cardId === 'receitas') {
          records = (receitasData?.receitas ?? []) as unknown as Record<string, unknown>[];
        } else if (cardId === 'despesas') {
          records = (despesasData?.despesas ?? []) as unknown as Record<string, unknown>[];
        } else if (cardId === 'balanco' || cardId === 'dados-abertos') {
          // Balanço e dados abertos usam KPIs
          const mensais = kpisData?.kpis_mensais ?? [];
          records = mensais.map((kpi) => ({
            mes: kpi.mes,
            ano: kpi.ano,
            total_receitas: kpi.total_receitas,
            total_despesas: kpi.total_despesas,
            saldo: kpi.saldo,
            execucao_receita_pct: kpi.percentual_execucao_receita ?? '',
            execucao_despesa_pct: kpi.percentual_execucao_despesa ?? '',
          }));
        } else if (cardId === 'previsoes') {
          // Previsões usam KPIs mensais como base
          const mensais = kpisData?.kpis_mensais ?? [];
          records = mensais.map((kpi) => ({
            mes: kpi.mes,
            ano: kpi.ano,
            total_receitas: kpi.total_receitas,
            total_despesas: kpi.total_despesas,
            saldo: kpi.saldo,
          }));
        } else {
          // KPIs consolidados
          const mensais = kpisData?.kpis_mensais ?? [];
          records = mensais.map((kpi) => ({
            mes: kpi.mes,
            ano: kpi.ano,
            total_receitas: kpi.total_receitas,
            total_despesas: kpi.total_despesas,
            saldo: kpi.saldo,
            execucao_receita_pct: kpi.percentual_execucao_receita ?? '',
            execucao_despesa_pct: kpi.percentual_execucao_despesa ?? '',
          }));
        }

        if (records.length === 0) {
          updateExportState(cardId, {
            status: 'error',
            message: 'Nenhum dado disponível para exportar',
          });
          return;
        }

        await exportData(records, {
          format,
          filename: `${config.filename}-${anoSelecionado}.${format}`,
        });

        updateExportState(cardId, {
          status: 'success',
          message: `${records.length} registros exportados`,
        });

        setTimeout(() => {
          updateExportState(cardId, { status: 'idle', message: '' });
        }, 3000);
      } catch {
        updateExportState(cardId, {
          status: 'error',
          message: 'Falha ao exportar. Tente novamente.',
        });
        setTimeout(() => {
          updateExportState(cardId, { status: 'idle', message: '' });
        }, 4000);
      }
    },
    [receitasData, despesasData, kpisData, anoSelecionado, exportData, updateExportState]
  );

  const getRecordCount = useCallback((cardId: string): number => {
    if (cardId === 'receitas') return receitasData?.receitas.length ?? 0;
    if (cardId === 'despesas') return despesasData?.despesas.length ?? 0;
    return kpisData?.kpis_mensais?.length ?? 0;
  }, [receitasData, despesasData, kpisData]);

  const renderStatusBadge = (cardId: string) => {
    const state = exportStates[cardId];
    if (state.status === 'idle') return null;

    const badgeStyles: Record<ExportStatus, { bg: string; iconName: string; text: string; spin?: boolean }> = {
      idle: { bg: '', iconName: '', text: '' },
      loading: { bg: 'bg-tertiary/10 text-tertiary', iconName: 'progress_activity', text: 'Exportando...', spin: true },
      success: { bg: 'bg-secondary/10 text-secondary', iconName: 'check_circle', text: state.message },
      error: { bg: 'bg-error/10 text-error', iconName: 'error', text: state.message },
    };

    const { bg, iconName, text, spin } = badgeStyles[state.status];

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${bg}`}>
        {iconName && <Icon name={iconName} size={16} className={spin ? 'animate-spin' : ''} />}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary-container/20">
              <Icon name="download" className="text-secondary" size={22} />
            </div>
            <span className="chip-secondary">Exportação de Dados</span>
          </div>
          <h1 className="font-display font-bold text-headline-lg sm:text-display-sm text-on-surface tracking-tight">
            Relatórios e Exportação
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant max-w-lg">
            Exporte dados financeiros municipais em diferentes formatos para análise e prestação de contas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-label-md text-on-surface-variant">Ano:</label>
          <select
            id="year-select"
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className="select-field w-auto"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* ── Quick Summary KPIs ──────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 shadow-ambient">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Receitas em {anoSelecionado}
          </p>
          <p className="text-headline-lg font-display font-bold text-secondary">
            {formatCurrency(receitasData?.receitas.reduce((s, r) => s + r.valor_arrecadado, 0) ?? 0, { compact: true })}
          </p>
        </div>
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 shadow-ambient">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Despesas em {anoSelecionado}
          </p>
          <p className="text-headline-lg font-display font-bold text-expense">
            {formatCurrency(despesasData?.despesas.reduce((s, d) => s + d.valor_pago, 0) ?? 0, { compact: true })}
          </p>
        </div>
        <div className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 shadow-ambient">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Saldo em {anoSelecionado}
          </p>
          <p className="text-headline-lg font-display font-bold text-tertiary">
            {formatCurrency(kpisData?.saldo ?? 0, { compact: true })}
          </p>
        </div>
      </motion.div>

      {/* ── Export Cards Grid ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPORT_CARDS.map((card) => {
          const cardState = exportStates[card.id];
          const isLoading = cardState.status === 'loading' || isExporting;
          const count = getRecordCount(card.id);

          return (
            <div
              key={card.id}
              className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 shadow-ambient hover:shadow-ambient-lg transition-shadow duration-300"
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${card.iconBgClass}`}>
                  <Icon name={card.iconName} size={24} className={card.colorClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-title-md text-on-surface font-display">{card.title}</h3>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">{card.description}</p>
                </div>
              </div>

              {/* Record count */}
              <p className="text-label-md text-on-surface-variant/60 mb-4">
                {count} registro{count !== 1 ? 's' : ''} disponíve{count !== 1 ? 'is' : 'l'} para {anoSelecionado}
              </p>

              {/* Status badge */}
              <div className="mb-4 min-h-[28px]">
                {renderStatusBadge(card.id)}
              </div>

              {/* Format buttons */}
              <div className="flex gap-3">
                {card.formats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(card.id, fmt)}
                    disabled={isLoading || count === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                               bg-primary text-on-primary font-medium text-sm
                               hover:bg-primary-container hover:text-on-primary-container
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-base">
                      {fmt === 'csv' ? 'table' : 'description'}
                    </span>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Info Section ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-6 shadow-ambient">
        <div className="flex items-start gap-3">
          <Icon name="download" size={20} className="text-on-surface-variant mt-0.5" />
          <div>
            <h3 className="text-title-sm text-on-surface font-display">Sobre a exportação</h3>
            <ul className="mt-2 text-body-sm text-on-surface-variant space-y-1.5">
              <li className="flex items-start gap-2">
                <Icon name="table" size={14} className="text-secondary mt-0.5 shrink-0" />
                <span><strong className="text-on-surface">CSV</strong> — compatível com Excel, Google Sheets e outros softwares</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="description" size={14} className="text-tertiary mt-0.5 shrink-0" />
                <span><strong className="text-on-surface">JSON</strong> — formato estruturado para integração com sistemas e APIs</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="info" size={14} className="text-on-surface-variant mt-0.5 shrink-0" />
                <span>Os dados são exportados conforme o ano selecionado no filtro acima</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
