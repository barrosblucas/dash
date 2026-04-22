'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { useReceitas, useDespesas, useKPIs } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/utils';

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
  colorClass: string;
  iconBgClass: string;
  filename: string;
}

const EXPORT_CARDS: ExportCardConfig[] = [
  {
    id: 'receitas',
    iconName: 'trending_up',
    title: 'Relatório de Receitas',
    description: 'Dados de arrecadação municipal',
    colorClass: 'text-secondary',
    iconBgClass: 'bg-secondary/10',
    filename: 'receitas',
  },
  {
    id: 'despesas',
    iconName: 'trending_down',
    title: 'Relatório de Despesas',
    description: 'Dados de execução orçamentária',
    colorClass: 'text-error',
    iconBgClass: 'bg-error/10',
    filename: 'despesas',
  },
  {
    id: 'kpis',
    iconName: 'bar_chart',
    title: 'KPIs Consolidados',
    description: 'Indicadores financeiros consolidados',
    colorClass: 'text-tertiary',
    iconBgClass: 'bg-tertiary/10',
    filename: 'kpis-consolidados',
  },
];

export default function RelatoriosClient() {
  const { anoSelecionado, setAnoSelecionado } = useDashboardFilters();
  const anosDisponiveis = useAnosDisponiveis();
  const { exportData, isExporting } = useExport();

  const [exportStates, setExportStates] = useState<Record<string, ExportState>>({
    receitas: { status: 'idle', message: '' },
    despesas: { status: 'idle', message: '' },
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
        } else {
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

  const recordCounts: Record<string, number> = {
    receitas: receitasData?.receitas.length ?? 0,
    despesas: despesasData?.despesas.length ?? 0,
    kpis: kpisData?.kpis_mensais?.length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Cabeçalho monumental */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-display-sm font-display text-on-surface">Relatórios e Exportação</h1>
            <p className="text-body-md text-on-surface-variant mt-2">Exporte dados financeiros em diferentes formatos</p>
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

        {/* Resumo rápido */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="metric-card">
            <p className="metric-label">Receitas em {anoSelecionado}</p>
            <p className="metric-value text-secondary">
              {formatCurrency(receitasData?.receitas.reduce((s, r) => s + r.valor_arrecadado, 0) ?? 0, { compact: true })}
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Despesas em {anoSelecionado}</p>
            <p className="metric-value text-error">
              {formatCurrency(despesasData?.despesas.reduce((s, d) => s + d.valor_pago, 0) ?? 0, { compact: true })}
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Saldo em {anoSelecionado}</p>
            <p className="metric-value text-tertiary">
              {formatCurrency(kpisData?.saldo ?? 0, { compact: true })}
            </p>
          </div>
        </motion.div>

        {/* Cards de exportação */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {EXPORT_CARDS.map((card) => {
            const cardState = exportStates[card.id];
            const isLoading = cardState.status === 'loading' || isExporting;
            const count = recordCounts[card.id];

            return (
              <div
                key={card.id}
                className="elevated-card p-6 hover:shadow-ambient-lg transition-all duration-300"
              >
                {/* Ícone e título */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${card.iconBgClass}`}>
                    <Icon name={card.iconName} size={24} className={card.colorClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-title-md text-on-surface">{card.title}</h3>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{card.description}</p>
                  </div>
                </div>

                {/* Contagem de registros */}
                <p className="text-label-md text-on-surface-variant/60 mb-4">
                  {count} registro{count !== 1 ? 's' : ''} disponíve{count !== 1 ? 'is' : 'l'} para {anoSelecionado}
                </p>

                {/* Status */}
                <div className="mb-4 min-h-[28px]">
                  {renderStatusBadge(card.id)}
                </div>

                {/* Botões de formato */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport(card.id, 'csv')}
                    disabled={isLoading || count === 0}
                    className="flex-1 btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="table" size={18} className="text-secondary" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(card.id, 'json')}
                    disabled={isLoading || count === 0}
                    className="flex-1 btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="description" size={18} className="text-tertiary" />
                    JSON
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Seção informativa */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="surface-card p-6"
        >
          <div className="flex items-start gap-3">
            <Icon name="download" size={20} className="text-on-surface-variant mt-0.5" />
            <div>
              <h3 className="text-title-sm text-on-surface">Sobre a exportação</h3>
              <ul className="mt-2 text-body-sm text-on-surface-variant space-y-1">
                <li>• <strong className="text-on-surface">CSV</strong> — compatível com Excel, Google Sheets e outros softwares de planilha</li>
                <li>• <strong className="text-on-surface">JSON</strong> — formato estruturado para integração com sistemas e APIs</li>
                <li>• Os dados são exportados conforme o ano selecionado no filtro acima</li>
                <li>• Registros nulos ou ausentes podem aparecer como valores vazios</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
