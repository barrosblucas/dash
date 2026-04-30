'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useInView as useIOInView } from 'react-intersection-observer';

import PortalHeader from '@/components/layouts/PortalHeader';
import PortalFooter from '@/components/layouts/PortalFooter';

interface DashboardAction {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryIcon: string;
  investment: string;
  investmentRaw: number;
  impactLabel: string;
  impactNumber: number;
  impactSuffix: string;
  image: string;
  month: string;
  year: string;
  status: 'concluída' | 'em andamento';
  color: string;
  progress: number;
}

const actions: DashboardAction[] = [
  { id: 1, title: 'Pavimentação da Av. Central', description: 'Recapeamento integral de 3,2 km com nova sinalização, acessibilidade universal e galerias pluviais. Beneficiou 12 mil moradores da região central.',
    category: 'Infraestrutura', categoryIcon: 'road', investment: 'R$ 4.200.000', investmentRaw: 4200000, impactLabel: 'Beneficiados', impactNumber: 12, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80', month: 'Janeiro', year: '2024', status: 'concluída', color: '#3b82f6', progress: 100 },
  { id: 2, title: 'UBS Jardim América', description: 'Unidade com 420m², 4 consultórios, farmácia e acolhimento. Atendimento ampliado para 8 mil pacientes da região sul.',
    category: 'Saúde', categoryIcon: 'local_hospital', investment: 'R$ 2.800.000', investmentRaw: 2800000, impactLabel: 'Pacientes', impactNumber: 8, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', month: 'Março', year: '2024', status: 'concluída', color: '#10b981', progress: 100 },
  { id: 3, title: 'Praça da Juventude', description: 'Academia ao ar livre, playground inclusivo, pista de skate, quadra poliesportiva e Wi-Fi gratuito. Mais de 5 mil visitantes mensais.',
    category: 'Lazer', categoryIcon: 'sports_soccer', investment: 'R$ 1.500.000', investmentRaw: 1500000, impactLabel: 'Visitantes/mês', impactNumber: 5, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80', month: 'Maio', year: '2024', status: 'concluída', color: '#ec4899', progress: 100 },
  { id: 4, title: 'Iluminação LED', description: 'Substituição de 2.400 pontos de iluminação com redução de 60% no consumo energético. Melhoria da segurança em 18 bairros.',
    category: 'Urbanismo', categoryIcon: 'lightbulb', investment: 'R$ 3.100.000', investmentRaw: 3100000, impactLabel: 'Economia energ.', impactNumber: 60, impactSuffix: '%',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80', month: 'Julho', year: '2024', status: 'concluída', color: '#f59e0b', progress: 100 },
  { id: 5, title: 'Escola Municipal Prof. João Silva', description: 'Construção de 8 salas de aula, laboratório de informática, biblioteca e quadra coberta. Capacidade para 480 alunos em período integral.',
    category: 'Educação', categoryIcon: 'school', investment: 'R$ 6.500.000', investmentRaw: 6500000, impactLabel: 'Alunos', impactNumber: 480, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', month: 'Setembro', year: '2024', status: 'em andamento', color: '#8b5cf6', progress: 72 },
  { id: 6, title: 'Rede de Esgoto — Bairro Progresso', description: 'Implantação de 4,8 km de rede coletora, ligação domiciliar e estação elevatória. Universalização do saneamento para 1.800 famílias.',
    category: 'Saneamento', categoryIcon: 'water_drop', investment: 'R$ 5.300.000', investmentRaw: 5300000, impactLabel: 'Famílias', impactNumber: 1800, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', month: 'Janeiro', year: '2025', status: 'em andamento', color: '#06b6d4', progress: 55 },
  { id: 7, title: 'CRAS — Centro de Referência', description: 'Centro de Assistência Social com brinquedoteca, salas de capacitação e cursos profissionalizantes. 3.500 atendimentos por ano.',
    category: 'Assistência', categoryIcon: 'volunteer_activism', investment: 'R$ 1.900.000', investmentRaw: 1900000, impactLabel: 'Atendidos/ano', impactNumber: 3500, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80', month: 'Fevereiro', year: '2025', status: 'concluída', color: '#f43f5e', progress: 100 },
];

const categories = ['Todas', 'Infraestrutura', 'Saúde', 'Lazer', 'Urbanismo', 'Educação', 'Saneamento', 'Assistência'];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useIOInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else { setCount(start); }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString('pt-BR')}{suffix}</span>;
}

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

function DashboardCard({ action }: { action: DashboardAction }) {
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
