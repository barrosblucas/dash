'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

import type { DashboardAction } from './constants';
import { AnimatedCounter } from './animated-counter';

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: '0%' }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 160;
  const height = 40;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
      {values.map((v, i) => {
        const cx = (i / (values.length - 1)) * width;
        const cy = height - ((v - min) / range) * height;
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="3"
            fill={color}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
          />
        );
      })}
    </svg>
  );
}

export function DashboardCard({ action }: { action: DashboardAction }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <div className="relative bg-surface-container-lowest rounded-3xl border border-outline-variant/5 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: action.color }} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <div className="lg:w-72 flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4">
                <motion.img
                  src={action.image}
                  alt={action.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white text-xs font-headline font-bold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    {action.month} {action.year}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-headline font-bold backdrop-blur-sm ${
                      action.status === 'concluída' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${action.status === 'concluída' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    {action.status === 'concluída' ? 'Concluída' : 'Em andamento'}
                  </span>
                </div>
              </div>

              <Sparkline values={[2, 5, 3, 8, 6, 4, 7, 9, 5, 8, 6, 10]} color={action.color} />

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-headline font-bold uppercase text-on-surface-variant tracking-wider">Progresso</span>
                  <span className="text-[10px] font-headline font-bold text-primary">{action.progress}%</span>
                </div>
                <ProgressBar value={action.progress} color={action.color} />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: action.color }}
                    whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                  >
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {action.categoryIcon}
                    </span>
                  </motion.div>
                  <span className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">{action.category}</span>
                </div>

                <h3 className="font-headline font-extrabold text-2xl text-primary mb-3 leading-tight group-hover:translate-x-1 transition-transform duration-300">
                  {action.title}
                </h3>

                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">{action.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="relative overflow-hidden rounded-2xl p-4 border border-emerald-500/10" style={{ backgroundColor: action.color + '0A' }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-5" style={{ backgroundColor: action.color }} />
                  <span className="material-symbols-outlined text-emerald-400 text-lg mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  <p className="text-[10px] uppercase font-headline font-bold text-on-surface-variant tracking-wider">Investimento</p>
                  <p className="font-headline font-extrabold text-base text-emerald-400 mt-0.5">{action.investment}</p>
                </div>

                <div className="relative overflow-hidden rounded-2xl p-4 border border-secondary/10" style={{ backgroundColor: action.color + '0A' }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-5" style={{ backgroundColor: action.color }} />
                  <span className="material-symbols-outlined text-lg mb-1 block" style={{ color: action.color, fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  <p className="text-[10px] uppercase font-headline font-bold text-on-surface-variant tracking-wider">{action.impactLabel}</p>
                  <p className="font-headline font-extrabold text-base mt-0.5" style={{ color: action.color }}>
                    +<AnimatedCounter value={action.impactNumber} suffix={action.impactSuffix} />
                  </p>
                </div>

                <motion.div
                  className="relative overflow-hidden rounded-2xl p-4 border border-outline-variant/5 bg-surface-container-high flex flex-col items-center justify-center text-center"
                  whileHover={{ scale: 1.03 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: action.color + '20' }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ color: action.color, fontVariationSettings: "'FILL' 1" }}>insights</span>
                  </motion.div>
                  <p className="font-headline font-extrabold text-lg text-primary">
                    <AnimatedCounter value={action.status === 'concluída' ? 100 : action.progress} suffix="%" />
                  </p>
                  <p className="text-[10px] font-headline font-bold text-on-surface-variant mt-0.5">Execução</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="absolute -bottom-2 -right-2 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl -z-10"
          style={{ backgroundColor: action.color + '30' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
