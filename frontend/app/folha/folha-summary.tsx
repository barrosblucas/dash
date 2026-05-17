'use client';

import { motion } from 'framer-motion';

import { formatCurrency } from '@/lib/utils';
import type { FolhaOfficeAggregated, FolhaResumoMensal } from '@/types/folha';

/* ── Individual summary card ── */

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
      <div className="flex items-start justify-between mb-3">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <p className="text-headline-lg font-display font-bold text-on-surface">{value}</p>
    </div>
  );
}

/* ── 4-card summary grid ── */

interface FolhaSummaryProps {
  resumo: FolhaResumoMensal | undefined;
  isLoading: boolean;
}

export function FolhaSummary({ resumo, isLoading }: FolhaSummaryProps) {
  if (!resumo || isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      <SummaryCard
        icon="badge"
        label="Servidores"
        value={String(resumo.quantidade_servidores)}
        color="#22c55e"
      />
      <SummaryCard
        icon="account_balance_wallet"
        label="Total Bruto"
        value={formatCurrency(resumo.total_bruto)}
        color="#06b6d4"
      />
      <SummaryCard
        icon="payments"
        label="Total Liquido"
        value={formatCurrency(resumo.total_liquido)}
        color="#a855f7"
      />
      <SummaryCard
        icon="money_off"
        label="Descontos"
        value={formatCurrency(resumo.total_descontos)}
        color="#f97316"
      />
    </motion.div>
  );
}

/* ── Aggregated per-office totals table ── */

interface FolhaAggregatedTableProps {
  items: FolhaOfficeAggregated[];
  show: boolean;
  onToggle: () => void;
}

export function FolhaAggregatedTable({
  items,
  show,
  onToggle,
}: FolhaAggregatedTableProps) {
  if (items.length <= 1) return null;

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-headline-sm font-display text-on-surface mb-3 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          {show ? 'expand_less' : 'expand_more'}
        </span>
        Totalizadores por Orgao
      </button>

      {show && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 text-left">Orgao / Departamento</th>
                <th className="py-3 px-4 text-right">Servidores</th>
                <th className="py-3 px-4 text-right">Total Bruto</th>
                <th className="py-3 px-4 text-right">Total Liquido</th>
                <th className="py-3 px-4 text-right">Descontos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((agg) => (
                <tr
                  key={agg.office_id}
                  className="hover:bg-surface-container/50 transition-colors border-t border-outline/10"
                >
                  <td className="py-2.5 px-4">
                    <span className="text-sm font-medium text-on-surface">
                      {agg.office_description}
                    </span>
                    {agg.department_description && (
                      <span className="text-xs text-on-surface-variant block">
                        {agg.department_description}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm text-on-surface">
                      {agg.quantidade_servidores}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm text-on-surface">
                      {formatCurrency(agg.total_bruto)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm font-semibold text-on-surface">
                      {formatCurrency(agg.total_liquido)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm text-on-surface-variant">
                      {formatCurrency(agg.total_descontos)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
