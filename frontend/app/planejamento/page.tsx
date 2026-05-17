import type { Metadata } from 'next';
import Link from 'next/link';

import DashboardLayout from '@/components/layouts/DashboardLayout';

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
const BASE_URL = 'https://web.qualitysistemas.com.br/planejamento_orcamentario/prefeitura_municipal_de_bandeirantes';

export const metadata: Metadata = {
  title: 'Planejamento Orçamentário',
  description: 'Acesso ao planejamento orçamentário oficial de Bandeirantes MS.',
};

export default function PlanejamentoPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-ambient">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl">account_balance</span>
            </div>
            <div className="space-y-2">
              <span className="chip-secondary">Links oficiais</span>
              <h1 className="font-display text-headline-lg font-bold text-on-surface sm:text-display-sm">
                Planejamento Orçamentário
              </h1>
              <p className="max-w-3xl text-body-md text-on-surface-variant">
                Esta seção reúne os acessos oficiais ao planejamento orçamentário no portal Quality.
                Os documentos continuam hospedados na origem oficial.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {YEARS.map((year) => (
            <article
              key={year}
              className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-ambient"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-title-lg text-on-surface">Exercício {year}</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary">
                  Oficial
                </span>
              </div>
              <p className="mb-5 text-body-sm text-on-surface-variant">
                Consulte PPA, LDO, LOA e peças correlatas diretamente no portal oficial da entidade.
              </p>
              <Link
                href={BASE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                Abrir portal oficial
              </Link>
            </article>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
