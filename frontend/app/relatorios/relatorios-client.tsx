'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import useExport from '@/hooks/useExport';
import { useDashboardFilters, useAnosDisponiveis } from '@/stores/filtersStore';
import { useReceitas, useDespesas, useKPIs } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type ExportFormat = 'csv' | 'json';
type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ExportState {
  status: ExportStatus;
  message: string;
}

interface ExportCardConfig {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass: string;
  iconBgClass: string;
  filename: string;
}

const EXPORT_CARDS: ExportCardConfig[] = [
  {
    id: 'receitas',
    icon: TrendingUp,
    title: 'Relatório de Receitas',
    description: 'Dados de arrecadação municipal',
    colorClass: 'text-revenue-accent',
    iconBgClass: 'bg-revenue-500/10',
    filename: 'receitas',
  },
  {
    id: 'despesas',
    icon: TrendingDown,
    title: 'Relatório de Despesas',
    description: 'Dados de execução orçamentária',
    colorClass: 'text-expense-accent',
    iconBgClass: 'bg-expense-500/10',
    filename: 'despesas',
  },
  {
    id: 'kpis',
    icon: BarChart3,
    title: 'KPIs Consolidados',
    description: 'Indicadores financeiros consolidados',
    colorClass: 'text-forecast-accent',
    iconBgClass: 'bg-forecast-500/10',
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

    const badgeStyles: Record<ExportStatus, { bg: string; icon: React.ElementType | null; text: string }> = {
      idle: { bg: '', icon: null, text: '' },
      loading: { bg: 'bg-forecast-500/10 text-forecast-400', icon: Loader2, text: 'Exportando...' },
      success: { bg: 'bg-revenue-500/10 text-revenue-400', icon: CheckCircle2, text: state.message },
      error: { bg: 'bg-expense-500/10 text-expense-400', icon: AlertCircle, text: state.message },
    };

    const { bg, icon: Icon, text } = badgeStyles[state.status];

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${bg}`}>
        {Icon && <Icon className={`w-3.5 h-3.5 ${state.status === 'loading' ? 'animate-spin' : ''}`} />}
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
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Relatórios e Exportação</h1>
            <p className="text-sm text-dark-400 mt-1">Exporte dados financeiros em diferentes formatos</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm text-dark-400">Ano:</label>
            <select
              id="year-select"
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-lg px-3 py-2 focus:ring-forecast-500 focus:border-forecast-500 outline-none"
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-dark-850 border border-dark-700 rounded-xl px-4 py-3">
            <p className="text-xs text-dark-400">Receitas em {anoSelecionado}</p>
            <p className="text-lg font-semibold text-revenue-accent">
              {formatCurrency(receitasData?.receitas.reduce((s, r) => s + r.valor_arrecadado, 0) ?? 0, { compact: true })}
            </p>
          </div>
          <div className="bg-dark-850 border border-dark-700 rounded-xl px-4 py-3">
            <p className="text-xs text-dark-400">Despesas em {anoSelecionado}</p>
            <p className="text-lg font-semibold text-expense-accent">
              {formatCurrency(despesasData?.despesas.reduce((s, d) => s + d.valor_pago, 0) ?? 0, { compact: true })}
            </p>
          </div>
          <div className="bg-dark-850 border border-dark-700 rounded-xl px-4 py-3">
            <p className="text-xs text-dark-400">Saldo em {anoSelecionado}</p>
            <p className="text-lg font-semibold text-forecast-accent">
              {formatCurrency(kpisData?.saldo ?? 0, { compact: true })}
            </p>
          </div>
        </div>

        {/* Cards de exportação */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {EXPORT_CARDS.map((card) => {
            const Icon = card.icon;
            const cardState = exportStates[card.id];
            const isLoading = cardState.status === 'loading' || isExporting;
            const count = recordCounts[card.id];

            return (
              <div
                key={card.id}
                className="bg-dark-850 border border-dark-700 rounded-xl p-6 hover:border-dark-600 transition-colors"
              >
                {/* Ícone e título */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${card.iconBgClass}`}>
                    <Icon className={`w-6 h-6 ${card.colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-dark-100">{card.title}</h3>
                    <p className="text-sm text-dark-400 mt-0.5">{card.description}</p>
                  </div>
                </div>

                {/* Contagem de registros */}
                <p className="text-xs text-dark-500 mb-4">
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed text-dark-200 text-sm font-medium rounded-lg border border-dark-600 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-revenue-400" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(card.id, 'json')}
                    disabled={isLoading || count === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed text-dark-200 text-sm font-medium rounded-lg border border-dark-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-forecast-400" />
                    JSON
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seção informativa */}
        <div className="bg-dark-850 border border-dark-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-dark-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-dark-200">Sobre a exportação</h3>
              <ul className="mt-2 text-xs text-dark-400 space-y-1">
                <li>• <strong className="text-dark-300">CSV</strong> — compatível com Excel, Google Sheets e outros softwares de planilha</li>
                <li>• <strong className="text-dark-300">JSON</strong> — formato estruturado para integração com sistemas e APIs</li>
                <li>• Os dados são exportados conforme o ano selecionado no filtro acima</li>
                <li>• Registros nulos ou ausentes podem aparecer como valores vazios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
