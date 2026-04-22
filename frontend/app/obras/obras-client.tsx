'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ── Mock Data ── */
const obras = [
  {
    id: 1,
    titulo: 'Reforma da Unidade de Saúde Central',
    status: 'em_andamento' as const,
    progresso: 65,
    secretaria: 'Saúde',
    inicio: 'Jan 2024',
    valor: 'R$ 1.200.000',
    descricao: 'Reforma completa da unidade de saúde central, incluindo ampliação do pronto-socorro e modernização dos consultórios médicos.',
  },
  {
    id: 2,
    titulo: 'Pavimentação Rua das Flores',
    status: 'em_andamento' as const,
    progresso: 40,
    secretaria: 'Obras',
    inicio: 'Mar 2024',
    valor: 'R$ 850.000',
    descricao: 'Pavimentação asfáltica da Rua das Flores e galerias pluviais nos trechos entre as Avenidas Central e Brasil.',
  },
  {
    id: 3,
    titulo: 'Construção do Centro Esportivo',
    status: 'planejada' as const,
    progresso: 0,
    secretaria: 'Esportes',
    inicio: 'Jun 2024',
    valor: 'R$ 2.500.000',
    descricao: 'Construção de centro esportivo com quadra poliesportiva, pista de caminhada e área de lazer para a comunidade.',
  },
  {
    id: 4,
    titulo: 'Ampliação da Escola Municipal',
    status: 'concluida' as const,
    progresso: 100,
    secretaria: 'Educação',
    inicio: 'Jul 2023',
    valor: 'R$ 980.000',
    descricao: 'Ampliação da escola municipal com 4 novas salas de aula, laboratório de informática e biblioteca.',
  },
  {
    id: 5,
    titulo: 'Reforma da Praça Central',
    status: 'em_andamento' as const,
    progresso: 80,
    secretaria: 'Urbanismo',
    inicio: 'Fev 2024',
    valor: 'R$ 450.000',
    descricao: 'Revitalização da praça central com novo paisagismo, iluminação LED e equipamentos de ginástica ao ar livre.',
  },
  {
    id: 6,
    titulo: 'Sistema de Esgoto - Vila Nova',
    status: 'em_andamento' as const,
    progresso: 30,
    secretaria: 'Saneamento',
    inicio: 'Abr 2024',
    valor: 'R$ 3.200.000',
    descricao: 'Implantação de rede coletora de esgoto no bairro Vila Nova, beneficiando aproximadamente 2.000 famílias.',
  },
];

/* ── Status Helpers ── */
type Status = 'em_andamento' | 'concluida' | 'planejada';

const statusConfig: Record<Status, { label: string; color: string; dotColor: string }> = {
  em_andamento: {
    label: 'Em Andamento',
    color: 'bg-secondary-container text-on-secondary-container',
    dotColor: 'bg-secondary',
  },
  concluida: {
    label: 'Concluída',
    color: 'bg-primary text-on-primary',
    dotColor: 'bg-primary',
  },
  planejada: {
    label: 'Planejada',
    color: 'bg-tertiary-container text-on-tertiary-container',
    dotColor: 'bg-tertiary',
  },
};

const filters = [
  { key: 'todas', label: 'Todas' },
  { key: 'em_andamento', label: 'Em Andamento' },
  { key: 'concluida', label: 'Concluídas' },
  { key: 'planejada', label: 'Planejadas' },
] as const;

/* ── Component ── */
export default function ObrasClient() {
  const [activeFilter, setActiveFilter] = useState<string>('todas');

  const filteredObras =
    activeFilter === 'todas'
      ? obras
      : obras.filter((o) => o.status === activeFilter);

  const stats = [
    {
      icon: 'apartment',
      value: obras.length.toString(),
      label: 'Total Obras',
    },
    {
      icon: 'engineering',
      value: obras.filter((o) => o.status === 'em_andamento').length.toString(),
      label: 'Em Andamento',
    },
    {
      icon: 'check_circle',
      value: obras.filter((o) => o.status === 'concluida').length.toString(),
      label: 'Concluídas',
    },
    {
      icon: 'account_balance_wallet',
      value: 'R$ 8,5 Mi',
      label: 'Investimento Total',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
          Obras Públicas
        </h1>
        <p className="mt-2 font-body text-on-surface-variant text-base max-w-2xl">
          Acompanhe em tempo real as obras e projetos de infraestrutura do
          município. Acesse detalhes, cronogramas e valores investidos.
        </p>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-full font-label text-sm font-medium transition-all duration-200 ${
              activeFilter === f.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── KPI Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl p-5 md:p-6 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-secondary text-xl">
                {stat.icon}
              </span>
            </div>
            <p className="font-headline text-2xl md:text-3xl font-extrabold text-primary dark:text-white">
              {stat.value}
            </p>
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant dark:text-slate-400 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Obras Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {filteredObras.map((obra) => {
          const cfg = statusConfig[obra.status];
          return (
            <Link
              key={obra.id}
              href={`/obras/${obra.id}`}
              className="group bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl overflow-hidden shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-primary/30 dark:text-primary/40 text-6xl">
                  construction
                </span>
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`}
                    />
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-headline font-bold text-primary dark:text-white text-lg leading-snug line-clamp-2">
                  {obra.titulo}
                </h3>

                <p className="font-body text-sm text-on-surface-variant dark:text-slate-400 line-clamp-2">
                  {obra.descricao}
                </p>

                {/* Progress Bar (only for active works) */}
                {obra.status === 'em_andamento' && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-label text-xs text-on-surface-variant dark:text-slate-400">
                        Progresso
                      </span>
                      <span className="font-label text-xs font-bold text-secondary dark:text-secondary-300">
                        {obra.progresso}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${obra.progresso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 font-label text-xs text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">
                      business
                    </span>
                    Secretaria de {obra.secretaria}
                  </span>
                  <span className="flex items-center gap-2 font-label text-xs text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    Início: {obra.inicio}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-container-high dark:border-slate-700">
                  <span className="font-headline font-bold text-primary dark:text-white text-sm">
                    {obra.valor}
                  </span>
                  <span className="flex items-center gap-1 font-label text-xs font-medium text-secondary dark:text-secondary-300 group-hover:translate-x-1 transition-transform duration-200">
                    Ver Detalhes
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Empty State ── */}
      {filteredObras.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-6xl mb-4">
            search_off
          </span>
          <p className="font-headline text-xl font-bold text-primary dark:text-white">
            Nenhuma obra encontrada
          </p>
          <p className="font-body text-sm text-on-surface-variant dark:text-slate-400 mt-1">
            Tente selecionar outro filtro de status.
          </p>
        </div>
      )}
    </div>
  );
}
