'use client';

import { motion } from 'framer-motion';

import Icon from '@/components/ui/Icon';
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <KpiCard
          label="Total Receitas"
          value={data.total_receitas}
          count={data.items.filter((i) => i.tipo === 'R').length}
          iconName="trending_up"
          accentColor={COLORS.revenue.DEFAULT}
        />
        <KpiCard
          label="Total Despesas"
          value={data.total_despesas}
          count={data.items.filter((i) => i.tipo === 'D').length}
          iconName="trending_down"
          accentColor={COLORS.expense.DEFAULT}
        />
        <KpiCard
          label="Saldo"
          value={data.saldo}
          count={data.quantidade}
          iconName={data.saldo >= 0 ? 'bar_chart' : 'warning'}
          accentColor={data.saldo >= 0 ? COLORS.forecast.DEFAULT : COLORS.expense.DEFAULT}
        />
      </motion.div>

      {/* ─── Insight Cards do Mês ─── */}
      {(data.insights_receitas?.length > 0 || data.insights_despesas?.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="emoji_events" size={18} className="text-on-surface-variant" />
            <h2 className="text-headline-sm font-display text-on-surface">Destaques do Mês</h2>
          </div>

          {/* Só Receitas — cards em linha horizontal */}
          {tipo === 'R' && data.insights_receitas?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="trending_up" size={18} className="text-secondary" />
                <h3 className="text-sm font-semibold text-secondary">Top Receitas</h3>
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
                <Icon name="trending_down" size={18} className="text-error" />
                <h3 className="text-sm font-semibold text-error">Top Despesas</h3>
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
                    <Icon name="trending_up" size={18} className="text-secondary" />
                    <h3 className="text-sm font-semibold text-secondary">Top Receitas</h3>
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
                    <Icon name="trending_down" size={18} className="text-error" />
                    <h3 className="text-sm font-semibold text-error">Top Despesas</h3>
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
        </motion.section>
      )}

      {/* ─── Insight Banner ─── */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="surface-card p-4 bg-tertiary/5"
        >
          <div className="flex items-start gap-3">
            <Icon name="lightbulb" size={20} className="text-tertiary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-tertiary mb-1.5">
                Observações do período
              </h3>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-sm text-on-surface-variant">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Fund Summary Cards ─── */}
      {data.fundos_resumo.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="visibility" size={18} className="text-on-surface-variant" />
            <h2 className="text-headline-sm font-display text-on-surface">Resumo por Fundo</h2>
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
        </motion.section>
      )}

      {/* ─── Items Table/List ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-headline-sm font-display text-on-surface">
            Itens ({filteredItems.length})
          </h2>

          {/* Search */}
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Buscar por descrição ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full sm:w-72 rounded-lg pl-10"
            />
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-on-surface-variant/50">Ordenar por:</span>
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
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
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
            <Icon name="bar_chart" size={40} className="text-outline mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium mb-1">Nenhum item encontrado</p>
            <p className="text-sm text-on-surface-variant/60">
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
          <div className="hidden lg:block surface-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Fornecedor</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-right py-3 px-4">Valor</th>
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
      </motion.section>

      {/* ─── Glossary (collapsible) ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pt-4"
      >
        <button
          onClick={() => setShowGlossary(!showGlossary)}
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="menu_book" size={18} />
          <span>Glossário — O que cada termo significa?</span>
          <Icon name={showGlossary ? 'expand_less' : 'expand_more'} size={18} />
        </button>

        {showGlossary && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(GLOSSARIO_FUNDOS).map(([key, entry]) => (
              <div
                key={key}
                className="surface-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.cor }}
                  />
                  <h4 className="text-sm font-semibold text-on-surface">{key}</h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-1.5">{entry.nome}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{entry.descricao}</p>
                <div className="mt-2 pt-2">
                  <p className="text-xs text-tertiary/80">
                    <span className="font-medium">Impacto para você:</span>{' '}
                    {entry.impacto_cidadao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </>
  );
}
