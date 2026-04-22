'use client';

import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
import type { MovimentoExtraAnualResponse } from '@/types/movimento-extra';

import { KpiCard } from './kpi-card';
import { InsightCard } from './insight-card';
import { MonthlyEvolutionBar } from './monthly-bar';

interface AnualViewProps {
  dataAnual: MovimentoExtraAnualResponse;
}

export function AnualView({ dataAnual }: AnualViewProps) {
  return (
    <>
      {/* Annual KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Receitas Anuais"
          value={dataAnual.total_receitas}
          iconName="trending_up"
          accentColor="#22c55e"
        />
        <KpiCard
          label="Despesas Anuais"
          value={dataAnual.total_despesas}
          iconName="trending_down"
          accentColor="#f97316"
        />
        <KpiCard
          label="Saldo Anual"
          value={dataAnual.saldo}
          iconName={dataAnual.saldo >= 0 ? 'bar_chart' : 'warning'}
          accentColor={dataAnual.saldo >= 0 ? '#06b6d4' : '#f97316'}
        />
        {/* Total de Itens — card simples sem formatação de moeda */}
        <div className="metric-card transition-all duration-300 hover:shadow-ambient">
          <div className="flex items-start justify-between mb-3">
            <span className="metric-label">Total de Itens</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#a855f718', color: '#a855f7' }}
            >
              <Icon name="sync_alt" size={20} />
            </div>
          </div>
          <p className="metric-value">
            {dataAnual.quantidade_total.toLocaleString('pt-BR')}
          </p>
        </div>
      </motion.div>

      {/* Monthly Evolution */}
      {dataAnual.evolucao_mensal?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="calendar_month" size={18} className="text-on-surface-variant" />
            <h2 className="text-headline-sm font-display text-on-surface">Evolução Mensal</h2>
          </div>
          <div className="surface-card p-4">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-secondary/70" />
                <span className="text-xs text-on-surface-variant">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/70" />
                <span className="text-xs text-on-surface-variant">Despesas</span>
              </div>
            </div>
            {(() => {
              const maxVal = Math.max(
                ...dataAnual.evolucao_mensal.map(m => Math.max(m.total_receitas, m.total_despesas)),
                1
              );
              return dataAnual.evolucao_mensal.map(item => (
                <MonthlyEvolutionBar key={item.mes} item={item} maxVal={maxVal} />
              ));
            })()}
          </div>
        </motion.section>
      )}

      {/* Annual Insights */}
      {(dataAnual.insights_receitas?.length > 0 || dataAnual.insights_despesas?.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="emoji_events" size={18} className="text-on-surface-variant" />
            <h2 className="text-headline-sm font-display text-on-surface">Destaques do Ano</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dataAnual.insights_receitas?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="trending_up" size={18} className="text-secondary" />
                  <h3 className="text-sm font-semibold text-secondary">Top Receitas</h3>
                </div>
                <div className="space-y-3">
                  {dataAnual.insights_receitas.map((insight, i) => (
                    <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
            {dataAnual.insights_despesas?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="trending_down" size={18} className="text-error" />
                  <h3 className="text-sm font-semibold text-error">Top Despesas</h3>
                </div>
                <div className="space-y-3">
                  {dataAnual.insights_despesas.map((insight, i) => (
                    <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </>
  );
}
