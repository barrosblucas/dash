import type { Metadata } from 'next';
import Link from 'next/link';

import DashboardLayout from '@/components/layouts/DashboardLayout';

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
const BIMESTRES = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre',
  '5º Bimestre',
  '6º Bimestre',
];
const BASE_URL = 'https://web.qualitysistemas.com.br/rgf_e_rreo/prefeitura_municipal_de_bandeirantes';

export const metadata: Metadata = {
  title: 'RGF e RREO',
  description: 'Acesso aos relatórios fiscais oficiais de Bandeirantes MS.',
};

export default function RgfRreoPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-ambient">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
            <div className="space-y-2">
              <span className="chip-secondary">Relatórios oficiais</span>
              <h1 className="font-display text-headline-lg font-bold text-on-surface sm:text-display-sm">
                RGF e RREO
              </h1>
              <p className="max-w-3xl text-body-md text-on-surface-variant">
                Acesse o Relatório de Gestão Fiscal, o Relatório Resumido da Execução Orçamentária
                e os pareceres técnicos do TCE diretamente na fonte oficial.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {YEARS.map((year) => (
            <article
              key={year}
              className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-ambient"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-title-lg text-on-surface">Exercício {year}</h2>
                <Link
                  href={BASE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  Abrir portal oficial
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {BIMESTRES.map((periodo) => (
                  <div
                    key={`${year}-${periodo}`}
                    className="rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant"
                  >
                    <div className="mb-2 font-medium text-on-surface">{periodo}</div>
                    <div>RGF, RREO e pareceres disponíveis na origem oficial.</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
