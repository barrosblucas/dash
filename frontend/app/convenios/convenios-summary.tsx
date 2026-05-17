'use client';

import { motion } from 'framer-motion';

import { formatCurrency } from '@/lib/utils';
import type { ConvenioResumoAnual } from '@/types/convenio';

interface SummaryCardsProps {
  resumo: ConvenioResumoAnual;
}

export function SummaryCards({ resumo }: SummaryCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <div className="flex items-start justify-between mb-3">
          <span className="text-label-md text-on-surface-variant">
            Total Convenios
          </span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#22c55e18] text-[#22c55e]">
            <span className="material-symbols-outlined text-[20px]">
              handshake
            </span>
          </div>
        </div>
        <p className="text-headline-lg font-display font-bold text-on-surface">
          {resumo.quantidade_convenios}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <div className="flex items-start justify-between mb-3">
          <span className="text-label-md text-on-surface-variant">
            Valor Total
          </span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#06b6d418] text-[#06b6d4]">
            <span className="material-symbols-outlined text-[20px]">
              account_balance_wallet
            </span>
          </div>
        </div>
        <p className="text-headline-lg font-display font-bold text-on-surface">
          {formatCurrency(resumo.total_valor)}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <div className="flex items-start justify-between mb-3">
          <span className="text-label-md text-on-surface-variant">
            Receitas
          </span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#a855f718] text-[#a855f7]">
            <span className="material-symbols-outlined text-[20px]">
              arrow_circle_down
            </span>
          </div>
        </div>
        <p className="text-headline-lg font-display font-bold text-on-surface">
          {formatCurrency(resumo.total_receitas)}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
        <div className="flex items-start justify-between mb-3">
          <span className="text-label-md text-on-surface-variant">
            Despesas
          </span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f9731618] text-[#f97316]">
            <span className="material-symbols-outlined text-[20px]">
              arrow_circle_up
            </span>
          </div>
        </div>
        <p className="text-headline-lg font-display font-bold text-on-surface">
          {formatCurrency(resumo.total_despesas)}
        </p>
      </div>
    </motion.div>
  );
}
