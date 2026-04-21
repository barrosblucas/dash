'use client';

import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  Calendar,
  Trophy,
} from 'lucide-react';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Receitas Anuais"
          value={dataAnual.total_receitas}
          icon={TrendingUp}
          accentColor="#22c55e"
        />
        <KpiCard
          label="Despesas Anuais"
          value={dataAnual.total_despesas}
          icon={TrendingDown}
          accentColor="#f97316"
        />
        <KpiCard
          label="Saldo Anual"
          value={dataAnual.saldo}
          icon={dataAnual.saldo >= 0 ? BarChart3 : AlertTriangle}
          accentColor={dataAnual.saldo >= 0 ? '#06b6d4' : '#f97316'}
        />
        {/* Total de Itens — card simples sem formatação de moeda */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 backdrop-blur-sm p-5 transition-all duration-200 hover:border-dark-600/60">
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-dark-400">Total de Itens</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#a855f718', color: '#a855f7' }}
            >
              <ArrowLeftRight className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-dark-100 tracking-tight">
            {dataAnual.quantidade_total.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Monthly Evolution */}
      {dataAnual.evolucao_mensal?.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-dark-500" />
            <h2 className="text-lg font-semibold text-dark-200">Evolução Mensal</h2>
          </div>
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-xs text-dark-400">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500/70" />
                <span className="text-xs text-dark-400">Despesas</span>
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
        </section>
      )}

      {/* Annual Insights */}
      {(dataAnual.insights_receitas?.length > 0 || dataAnual.insights_despesas?.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-dark-500" />
            <h2 className="text-lg font-semibold text-dark-200">Destaques do Ano</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dataAnual.insights_receitas?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
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
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
                </div>
                <div className="space-y-3">
                  {dataAnual.insights_despesas.map((insight, i) => (
                    <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
