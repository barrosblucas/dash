'use client';

import { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

import PortalHeader from '@/components/layouts/PortalHeader';
import PortalFooter from '@/components/layouts/PortalFooter';

import { AnimatedCounter } from './animated-counter';
import { DashboardCard } from './dashboard-card';
import { actions, categories } from './constants';

function PieSlice({ color, startAngle, endAngle, size = 200 }: { color: string; startAngle: number; endAngle: number; size?: number }) {
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);

  return (
    <motion.path
      d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
      fill={color}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}

function DonutChart() {
  const total = actions.reduce((s, a) => s + a.investmentRaw, 0);
  let cumAngle = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {actions.map((a) => {
          const pct = (a.investmentRaw / total) * 360;
          const start = cumAngle;
          cumAngle += pct;
          return <PieSlice key={a.id} color={a.color} startAngle={start} endAngle={cumAngle} size={220} />;
        })}
        <circle cx="110" cy="110" r="62" fill="var(--color-surface-container-lowest)" />
        <text x="110" y="105" textAnchor="middle" fill="var(--color-primary)" fontSize="20" fontWeight="800" fontFamily="inherit">
          R$ {(total / 1e6).toFixed(1)}M
        </text>
        <text x="110" y="126" textAnchor="middle" fill="var(--color-on-surface-variant)" fontSize="10" fontWeight="600" fontFamily="inherit">
          Investimento total
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {actions.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-[11px] text-on-surface-variant font-medium truncate max-w-[110px]">{a.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {[
        { shape: 'circle' as const, x: 5, y: 15, size: 300, color: '#3b82f6', duration: 25 },
        { shape: 'square' as const, x: 85, y: 30, size: 200, color: '#8b5cf6', duration: 20 },
        { shape: 'circle' as const, x: 15, y: 70, size: 250, color: '#10b981', duration: 22 },
        { shape: 'square' as const, x: 75, y: 65, size: 180, color: '#ec4899', duration: 28 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className={`absolute opacity-[0.03] ${s.shape === 'circle' ? 'rounded-full' : 'rounded-3xl rotate-12'}`}
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, backgroundColor: s.color, transform: 'translate(-50%, -50%)' }}
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0], rotate: s.shape === 'square' ? [12, 24, 0, 12] : [0, 0, 0, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function TimelineV5Client() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [activeFilter, setActiveFilter] = useState('Todas');

  const filteredActions = useMemo(
    () => (activeFilter === 'Todas' ? actions : actions.filter((a) => a.category === activeFilter)),
    [activeFilter],
  );

  const totalInvest = actions.reduce((s, a) => s + a.investmentRaw, 0);
  const concluded = actions.filter((a) => a.status === 'concluída').length;
  const inProgress = actions.filter((a) => a.status === 'em andamento').length;

  const statsData = [
    { icon: 'account_balance_wallet', label: 'Total Investido', value: `R$ ${(totalInvest / 1e6).toFixed(1)}M`, color: '#3b82f6', numericValue: totalInvest / 1e6, suffix: ' M' },
    { icon: 'check_circle', label: 'Concluídas', value: concluded.toString(), color: '#10b981', numericValue: concluded, suffix: ' ações' },
    { icon: 'engineering', label: 'Em andamento', value: inProgress.toString(), color: '#f59e0b', numericValue: inProgress, suffix: ' ações' },
    { icon: 'apartment', label: 'Bairros atingidos', value: '18', color: '#8b5cf6', numericValue: 18, suffix: '' },
  ];

  return (
    <div className="min-h-screen bg-surface" ref={containerRef}>
      <FloatingShapes />

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-[60] origin-left"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
        }}
      />

      <PortalHeader />

      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-violet-500/[0.03]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-headline font-bold text-xs uppercase tracking-[0.2em] mb-8">
              <span className="material-symbols-outlined text-sm">dashboard</span>
              Painel de Dados
            </span>

            <h1 className="font-display-md text-primary leading-tight mb-6">
              Dashboard da{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
                Transformação
              </span>
            </h1>

            <p className="text-on-surface-variant font-body text-lg max-w-2xl mx-auto mb-8">
              Visualize os números, acompanhe o progresso e entenda o impacto de cada investimento em Bandeirantes.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statsData.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-5 border border-outline-variant/5 bg-surface-container-lowest"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-2xl opacity-8" style={{ backgroundColor: stat.color + '10' }} />
              <span className="material-symbols-outlined text-xl mb-2 block" style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <p className="font-headline font-extrabold text-xl text-primary">
                <AnimatedCounter value={stat.numericValue} suffix={stat.suffix} />
              </p>
              <p className="text-[11px] text-on-surface-variant font-headline font-bold mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-12">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-xs font-headline font-bold transition-all duration-300 ${
                activeFilter === cat
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/5'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="space-y-8">
              {filteredActions.map((action) => (
                <DashboardCard key={action.id} action={action} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <section className="relative py-16 px-6 overflow-hidden border-t border-outline-variant/5">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest to-surface" />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="font-display-sm text-primary mb-4">Distribuição por Categoria</h3>
            <p className="text-on-surface-variant font-body">Proporção do investimento total de R$ {(totalInvest / 1e6).toFixed(1)}M por área de atuação.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <DonutChart />
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display-sm text-primary mb-4"
          >
            Dados que inspiram confiança
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-on-surface-variant font-body text-lg max-w-md mx-auto"
          >
            Cada número representa uma vida impactada. Acompanhe em tempo real os resultados da gestão.
          </motion.p>
        </div>
      </section>

      <PortalFooter />
    </div>
  );
}
