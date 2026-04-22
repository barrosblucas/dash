'use client';

import { motion } from 'framer-motion';

import { COLORS } from '@/lib/constants';
import { GLOSSARIO_FUNDOS } from '@/types/movimento-extra';
import type { MovimentoExtraResponse, MovimentoTipo, MovimentoExtraItem } from '@/types/movimento-extra';

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
      {/* KPI Cards */}
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

      {/* Insight Cards */}
      {(data.insights_receitas?.length > 0 || data.insights_despesas?.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">emoji_events</span>
            <h2 className="text-headline-sm font-display text-on-surface">Destaques do Mês</h2>
          </div>

          {tipo === 'R' && data.insights_receitas?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-[18px]">trending_up</span>
                <h3 className="text-sm font-semibold text-secondary">Top Receitas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.insights_receitas.map((insight, i) => (
                  <InsightCard key={insight.categoria} insight={insight} accentColor="#22c55e" rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {tipo === 'D' && data.insights_despesas?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-error text-[18px]">trending_down</span>
                <h3 className="text-sm font-semibold text-error">Top Despesas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.insights_despesas.map((insight, i) => (
                  <InsightCard key={insight.categoria} insight={insight} accentColor="#f97316" rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {tipo === 'AMBOS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.insights_receitas?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-secondary text-[18px]">trending_up</span>
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
                    <span className="material-symbols-outlined text-error text-[18px]">trending_down</span>
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

      {/* Insight Banner */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient"
          style={{ borderLeft: '3px solid #c29b00' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">lightbulb</span>
            <div>
              <h3 className="text-sm font-semibold text-tertiary dark:text-amber-400 mb-1.5">
                Observações do período
              </h3>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-sm text-on-surface-variant">• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fundos grid */}
      {data.fundos_resumo.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">account_balance</span>
            <h2 className="text-headline-sm font-display text-on-surface">Fundos Municipais</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.fundos_resumo.map((fundo) => (
              <FundoCard
                key={fundo.fundo}
                fundo={fundo}
                onToggle={() => toggleFundo(fundo.fundo)}
                expanded={expandedFundos.has(fundo.fundo)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Search + Items list */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">receipt_long</span>
            <h2 className="text-headline-sm font-display text-on-surface">
              Itens ({filteredItems.length})
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar por descrição ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-high rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Mobile: card list */}
        <div className="space-y-2 lg:hidden">
          {filteredItems.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient">
              <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">search_off</span>
              <p className="text-on-surface-variant">Nenhum item encontrado</p>
            </div>
          ) : (
            filteredItems.map((item, i) => (
              <ItemRow key={`${item.codigo}-${item.ent_codigo}-${i}`} item={item} />
            ))
          )}
        </div>

        {/* Desktop: table */}
        {filteredItems.length > 0 && (
          <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-on-surface transition-colors"
                    onClick={() => handleSort('descricao')}
                  >
                    Descrição {sortField === 'descricao' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-on-surface transition-colors"
                    onClick={() => handleSort('fornecedor')}
                  >
                    Fornecedor {sortField === 'fornecedor' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:text-on-surface transition-colors"
                    onClick={() => handleSort('valor_recebido')}
                  >
                    Valor {sortField === 'valor_recebido' && (sortDir === 'asc' ? '↑' : '↓')}
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
      </motion.section>

      {/* Glossary accordion */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={() => setShowGlossary(!showGlossary)}
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>Glossário — O que cada termo significa?</span>
          <span className="material-symbols-outlined text-[18px]">
            {showGlossary ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showGlossary && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(GLOSSARIO_FUNDOS).map(([key, entry]) => (
              <div
                key={key}
          className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.cor }} />
                  <h4 className="text-sm font-semibold text-on-surface">{key}</h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-1.5">{entry.nome}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{entry.descricao}</p>
                <div className="mt-2 pt-2">
                  <p className="text-xs text-tertiary/80 dark:text-amber-400/70">
                    <span className="font-medium">Impacto para você:</span> {entry.impacto_cidadao}
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
