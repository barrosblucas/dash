'use client';

import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trophy,
  Eye,
  AlertTriangle,
} from 'lucide-react';

import { COLORS } from '@/lib/constants';
import { GLOSSARIO_FUNDOS } from '@/types/movimento-extra';
import type { MovimentoExtraResponse, MovimentoTipo } from '@/types/movimento-extra';
import type { MovimentoExtraItem } from '@/types/movimento-extra';

import { KpiCard } from './kpi-card';
import { FundoCard } from './fundo-card';
import { ItemRow, ItemTableRow } from './item-row';
import { InsightCard } from './insight-card';

interface MensalViewProps {
  data: MovimentoExtraResponse;
  tipo: MovimentoTipo;
  insights: string[];
  expandedFundos: Set<string>;
  toggleFundo: (fundo: string) => void;
  filteredItems: MovimentoExtraItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortField: 'descricao' | 'fornecedor' | 'valor_recebido';
  sortDir: 'asc' | 'desc';
  handleSort: (field: 'descricao' | 'fornecedor' | 'valor_recebido') => void;
  showGlossary: boolean;
  setShowGlossary: (show: boolean) => void;
}

export function MensalView({
  data,
  tipo,
  insights,
  expandedFundos,
  toggleFundo,
  filteredItems,
  searchTerm,
  setSearchTerm,
  sortField,
  sortDir,
  handleSort,
  showGlossary,
  setShowGlossary,
}: MensalViewProps) {
  return (
    <>
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Receitas"
          value={data.total_receitas}
          count={data.items.filter((i) => i.tipo === 'R').length}
          icon={TrendingUp}
          accentColor={COLORS.revenue.DEFAULT}
        />
        <KpiCard
          label="Total Despesas"
          value={data.total_despesas}
          count={data.items.filter((i) => i.tipo === 'D').length}
          icon={TrendingDown}
          accentColor={COLORS.expense.DEFAULT}
        />
        <KpiCard
          label="Saldo"
          value={data.saldo}
          count={data.quantidade}
          icon={data.saldo >= 0 ? BarChart3 : AlertTriangle}
          accentColor={data.saldo >= 0 ? COLORS.forecast.DEFAULT : COLORS.expense.DEFAULT}
        />
      </div>

      {/* ─── Insight Cards do Mês ─── */}
      {(data.insights_receitas?.length > 0 || data.insights_despesas?.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-dark-500" />
            <h2 className="text-lg font-semibold text-dark-200">Destaques do Mês</h2>
          </div>

          {/* Só Receitas — cards em linha horizontal */}
          {tipo === 'R' && data.insights_receitas?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.insights_receitas.map((insight, i) => (
                  <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Só Despesas — cards em linha horizontal */}
          {tipo === 'D' && data.insights_despesas?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.insights_despesas.map((insight, i) => (
                  <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Ambos — duas colunas lado a lado */}
          {tipo === 'AMBOS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.insights_receitas?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <h3 className="text-sm font-semibold text-green-400">Top Receitas</h3>
                  </div>
                  <div className="space-y-3">
                    {data.insights_receitas.map((insight, i) => (
                      <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
              {data.insights_despesas?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-orange-400">Top Despesas</h3>
                  </div>
                  <div className="space-y-3">
                    {data.insights_despesas.map((insight, i) => (
                      <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── Insight Banner ─── */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-forecast-500/20 bg-forecast-500/5 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-forecast-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-forecast-300 mb-1.5">
                Observações do período
              </h3>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-sm text-dark-300">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── Fund Summary Cards ─── */}
      {data.fundos_resumo.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-dark-500" />
            <h2 className="text-lg font-semibold text-dark-200">Resumo por Fundo</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.fundos_resumo.map((fundo) => (
              <FundoCard
                key={fundo.fundo}
                fundo={fundo}
                expanded={expandedFundos.has(fundo.fundo)}
                onToggle={() => toggleFundo(fundo.fundo)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Items Table/List ─── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-dark-200">
            Itens ({filteredItems.length})
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar por descrição ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-200 placeholder:text-dark-600 focus:outline-none focus:ring-1 focus:ring-forecast-500/50"
            />
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-dark-500">Ordenar por:</span>
          {(
            [
              ['descricao', 'Descrição'],
              ['fornecedor', 'Fornecedor'],
              ['valor_recebido', 'Valor'],
            ] as const
          ).map(([field, label]) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`
                px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                ${
                  sortField === field
                    ? 'bg-dark-700 text-dark-200'
                    : 'text-dark-500 hover:text-dark-400'
                }
              `}
            >
              {label}
              {sortField === field && (
                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-10 h-10 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 font-medium mb-1">Nenhum item encontrado</p>
            <p className="text-sm text-dark-500">
              {searchTerm
                ? 'Tente ajustar o termo de busca.'
                : 'Nenhuma movimentação registrada para este período.'}
            </p>
          </div>
        )}

        {/* Mobile: Cards */}
        <div className="space-y-3 lg:hidden">
          {filteredItems.map((item, i) => (
            <ItemRow key={`${item.codigo}-${item.ent_codigo}-${i}`} item={item} />
          ))}
        </div>

        {/* Desktop: Table */}
        {filteredItems.length > 0 && (
          <div className="hidden lg:block rounded-xl border border-dark-700/50 bg-dark-800/30 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/60">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, i) => (
                  <ItemTableRow key={`${item.codigo}-${item.ent_codigo}-${i}`} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Glossary (collapsible) ─── */}
      <section className="pt-4">
        <button
          onClick={() => setShowGlossary(!showGlossary)}
          className="flex items-center gap-2 text-sm font-medium text-dark-300 hover:text-dark-200 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Glossário — O que cada termo significa?</span>
          {showGlossary ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showGlossary && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(GLOSSARIO_FUNDOS).map(([key, entry]) => (
              <div
                key={key}
                className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.cor }}
                  />
                  <h4 className="text-sm font-semibold text-dark-200">{key}</h4>
                </div>
                <p className="text-xs text-dark-400 mb-1.5">{entry.nome}</p>
                <p className="text-sm text-dark-400 leading-relaxed">{entry.descricao}</p>
                <div className="mt-2 pt-2 border-t border-dark-700/30">
                  <p className="text-xs text-forecast-400/80">
                    <span className="font-medium">Impacto para você:</span>{' '}
                    {entry.impacto_cidadao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
