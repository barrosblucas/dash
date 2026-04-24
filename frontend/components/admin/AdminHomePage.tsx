import Link from 'next/link';

import AdminSaudeSyncPanel from './AdminSaudeSyncPanel';

const adminCards = [
  {
    href: '/admin/users',
    title: 'Gestão de usuários',
    description: 'Cadastre, edite acessos e execute reset de senha com rastreabilidade.',
    icon: 'group',
  },
  {
    href: '/admin/obras',
    title: 'Gestão de obras',
    description: 'Mantenha o catálogo público e atualize medições mensais com segurança.',
    icon: 'construction',
  },
  {
    href: '/admin/saude/unidades',
    title: 'Saúde Transparente',
    description: 'Gerencie unidades de saúde, horários, importação e sincronização manual.',
    icon: 'favorite',
  },
] as const;

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-ambient-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-primary-fixed-dim">Governança</p>
        <h2 className="mt-3 font-headline text-4xl font-extrabold">Painel administrativo</h2>
        <p className="mt-4 max-w-3xl text-sm text-primary-fixed-dim">
          Área isolada para autenticação, gestão de usuários e manutenção do cadastro de obras e saúde transparente.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl bg-surface-container-low p-7 shadow-ambient transition hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-4xl text-secondary">{card.icon}</span>
            <h3 className="mt-5 font-headline text-2xl font-bold text-primary">{card.title}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl bg-surface-container-low p-8 shadow-ambient">
        <div className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
            <span className="material-symbols-outlined text-base">sync</span>
            Saúde Transparente — Sincronização
          </span>
          <h2 className="font-headline text-2xl font-bold text-primary">Status da rotina de dados</h2>
          <p className="text-sm text-on-surface-variant">
            Monitoramento em tempo real da sincronização de dados do E-Saúde.
          </p>
        </div>
        <AdminSaudeSyncPanel />
      </section>
    </div>
  );
}
