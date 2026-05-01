'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import PortalHeader from '@/components/layouts/PortalHeader';
import PortalFooter from '@/components/layouts/PortalFooter';
import {
  mainNavCards,
  accentBorder,
  accentIconText,
  accentIconBg,
  accentCtaText,
  formatCurrencyCompact,
  renderDiarioDescription,
  getDiarioLink,
  timeAgo,
} from '@/components/portal/portal-data';
import { QuickInfoCard, QuickInfoExternalLink } from '@/components/portal/QuickInfoCard';
import { fetchDiarioHoje } from '@/services/diario-oficial-service';
import {
  fetchObraDestaque,
  fetchProximaLicitacao,
  fetchUltimaNoticia,
  fetchReceitasTotais,
} from '@/services/portal-service';
import type { DiarioResponse } from '@/types/diario-oficial';
import type { ObraRecord } from '@/types/obra';
import type { LicitacaoComprasBR } from '@/types/licitacao';
import type { NoticiaResponse } from '@/types/noticias';

/* ── Helper: estado de card com dados, loading e erro ── */
interface CardState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

function initialCard<T>(): CardState<T> {
  return { data: null, loading: true, error: false };
}

/* ────────────────────────────────────────────
   Componente principal
   ──────────────────────────────────────────── */

export default function PortalClient() {
  const [diario, setDiario] = useState<CardState<DiarioResponse>>(initialCard);
  const [receitas, setReceitas] = useState<CardState<number>>(initialCard);
  const [obra, setObra] = useState<CardState<ObraRecord>>(initialCard);
  const [licitacao, setLicitacao] = useState<CardState<LicitacaoComprasBR>>(initialCard);
  const [noticia, setNoticia] = useState<CardState<NoticiaResponse>>(initialCard);

  useEffect(() => {
    let cancelled = false;

    async function loadDiario() {
      try {
        const data = await fetchDiarioHoje();
        if (!cancelled) setDiario({ data, loading: false, error: false });
      } catch { if (!cancelled) setDiario({ data: null, loading: false, error: true }); }
    }
    async function loadReceitas() {
      try {
        const result = await fetchReceitasTotais();
        if (!cancelled) setReceitas({ data: result.receitas_total, loading: false, error: false });
      } catch { if (!cancelled) setReceitas({ data: null, loading: false, error: true }); }
    }
    async function loadObra() {
      try {
        const data = await fetchObraDestaque();
        if (!cancelled) setObra({ data, loading: false, error: false });
      } catch { if (!cancelled) setObra({ data: null, loading: false, error: true }); }
    }
    async function loadLicitacao() {
      try {
        const data = await fetchProximaLicitacao();
        if (!cancelled) setLicitacao({ data, loading: false, error: false });
      } catch { if (!cancelled) setLicitacao({ data: null, loading: false, error: true }); }
    }
    async function loadNoticia() {
      try {
        const data = await fetchUltimaNoticia();
        if (!cancelled) setNoticia({ data, loading: false, error: false });
      } catch { if (!cancelled) setNoticia({ data: null, loading: false, error: true }); }
    }

    loadDiario();
    loadReceitas();
    loadObra();
    loadLicitacao();
    loadNoticia();
    return () => { cancelled = true; };
  }, []);

  const diarioHref = diario.data ? getDiarioLink(diario.data) : null;

  const receitasDesc = receitas.error
    ? 'Serviço de arrecadação temporariamente indisponível.'
    : receitas.data != null
      ? `Total arrecadado até o momento: ${formatCurrencyCompact(receitas.data)}`
      : 'Dados de arrecadação não encontrados.';

  const obraDesc = obra.error
    ? 'Serviço de obras temporariamente indisponível.'
    : obra.data
      ? `${obra.data.titulo} — atualizado ${timeAgo(obra.data.updated_at)}.`
      : 'Nenhuma obra cadastrada no momento.';

  const licitacaoDesc = licitacao.error
    ? 'Serviço de licitações temporariamente indisponível.'
    : licitacao.data
      ? `${licitacao.data.modalidade} ${licitacao.data.numeroEdital} — ${licitacao.data.objeto.substring(0, 80)}${licitacao.data.objeto.length > 80 ? '...' : ''}`
      : 'Nenhuma licitação futura encontrada no momento.';

  const noticiaDesc = noticia.error
    ? 'Serviço de notícias temporariamente indisponível.'
    : noticia.data
      ? noticia.data.chamada.substring(0, 120) + (noticia.data.chamada.length > 120 ? '...' : '')
      : 'Nenhuma notícia disponível no momento.';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PortalHeader />
      <main className="flex-grow">

        {/* ───── Hero ───── */}
        <section className="hero-gradient pt-24 pb-32 px-6 sm:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at top right, #ffffff 0%, transparent 70%)' }}
          />
          <div className="max-w-screen-xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/80 text-white font-label text-sm font-semibold tracking-wide mb-6">
                  BANDEIRANTES - MS
                </span>
                <h1 className="font-headline font-extrabold text-4xl sm:text-5xl md:text-7xl text-white tracking-tighter leading-tight mb-4">
                  A verdade<br />em números.
                </h1>
                <p className="font-body text-xl text-white/70 leading-relaxed mb-10 max-w-2xl">
                  Acesso universal, claro e direto aos dados públicos do município.
                  Transparência não é apenas um portal, é o nosso compromisso com a sua cidadania.
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 max-w-2xl flex items-center shadow-[0_32px_32px_-4px_rgba(0,0,0,0.2)]">
                  <span className="material-symbols-outlined text-white pl-4 pr-2">search</span>
                  <input type="text"
                    placeholder="O que você procura? (ex: despesas, licitações, obras...)"
                    className="w-full bg-transparent border-none text-white placeholder:text-white/50 font-body text-lg focus:ring-0 focus:outline-none"
                  />
                  <button className="bg-secondary text-on-secondary px-6 sm:px-8 py-4 rounded-lg font-headline font-bold text-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors shrink-0">
                    Buscar
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 hidden lg:block">
                <div className="grid grid-cols-2 gap-4 opacity-90 rotate-3">
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-2xl flex flex-col gap-4 translate-y-8">
                    <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    <span className="font-headline font-bold text-primary dark:text-primary text-xl">
                      {receitas.loading ? '...' : receitas.data != null ? formatCurrencyCompact(receitas.data) : 'R$ 0'}
                    </span>
                    <span className="font-body text-sm text-on-surface-variant">Arrecadação Total</span>
                  </div>
                  <div className="bg-secondary p-6 rounded-xl shadow-2xl flex flex-col gap-4">
                    <span className="material-symbols-outlined text-on-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
                    <span className="font-headline font-bold text-on-secondary text-xl">
                      {obra.data?.titulo?.substring(0, 18) ?? 'Obras'}
                    </span>
                    <span className="font-body text-sm text-secondary-fixed-dim">
                      {obra.data ? `Atualizado ${timeAgo(obra.data.updated_at)}` : 'Em Andamento'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Main Navigation Cards ───── */}
        <section className="px-6 sm:px-8 -mt-16 relative z-20 max-w-screen-xl mx-auto pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainNavCards.map((card) => (
              <Link key={card.href} href={card.href}
                className={`bg-surface-container-lowest rounded-xl p-8 shadow-[0_32px_32px_-4px_rgba(0,25,60,0.06)] dark:shadow-[0_32px_32px_-4px_rgba(0,0,0,0.3)] group hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full border-b-[3px] ${accentBorder[card.accent]} ${card.offset ? 'lg:translate-y-8' : ''}`}
              >
                <div className={`w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-6 transition-colors ${accentIconBg[card.accent]} ${accentIconText[card.accent]}`}>
                  <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                </div>
                <h3 className="font-headline font-extrabold text-2xl text-primary mb-3">{card.title}</h3>
                <p className="font-body text-on-surface-variant mb-6 flex-grow">{card.description}</p>
                <span className={`font-headline font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all ${accentCtaText[card.accent]}`}>
                  {card.cta}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ───── Quick Access / Information Hub ───── */}
        <section className="bg-surface-container-low py-20 px-6 sm:px-8">
          <div className="max-w-screen-xl mx-auto">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-primary tracking-tight mb-10 text-center">
              Painel de Informações Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Diário Oficial */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary-container">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  <h4 className="font-headline font-bold text-lg text-primary">Diário Oficial do Dia</h4>
                </div>
                {diario.loading ? (
                  <p className="font-body text-sm text-on-surface-variant animate-pulse">Carregando...</p>
                ) : diario.error ? (
                  <p className="font-body text-sm text-on-surface-variant">Serviço temporariamente indisponível.</p>
                ) : diario.data && diario.data.tem_edicao && diarioHref ? (
                  <a href={diarioHref} target="_blank" rel="noopener noreferrer" className="block group">
                    <p className="font-body text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      {renderDiarioDescription(diario.data)}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 font-headline font-bold text-xs text-primary-container group-hover:gap-2 transition-all">
                      Baixar PDF
                      <span className="material-symbols-outlined text-sm">download</span>
                    </span>
                  </a>
                ) : (
                  <p className="font-body text-sm text-on-surface-variant">
                    {diario.data?.mensagem ?? 'Nenhuma edição publicada hoje.'}
                  </p>
                )}
              </div>

              {/* Contas Públicas → /dashboard */}
              <QuickInfoCard icon="account_balance_wallet" title="Contas Públicas"
                description={receitasDesc} border="border-secondary" iconColor="text-secondary"
                href="/dashboard" loading={receitas.loading} />

              {/* Obras em Destaque → /obras/[hash] */}
              <QuickInfoCard icon="construction" title="Obras em Destaque"
                description={obraDesc} border="border-primary" iconColor="text-primary"
                href={obra.data ? `/obras/${obra.data.hash}` : '/obras'} loading={obra.loading} />

              {/* Aviso de Licitação → /avisos-licitacoes */}
              <QuickInfoCard icon="gavel" title="Aviso de Licitação"
                description={licitacaoDesc} border="border-primary-container" iconColor="text-primary-container"
                href="/avisos-licitacoes" loading={licitacao.loading} />

              {/* Iluminação Pública (estático) */}
              <QuickInfoCard icon="lightbulb" title="Iluminação Pública"
                description="Dados: 98% de cobertura LED no município. 12 manutenções realizadas nas últimas 24h."
                border="border-secondary" iconColor="text-secondary" href={null} loading={false} />

              {/* Notícias do Município → link externo */}
              <QuickInfoExternalLink icon="newspaper" title="Notícias do Município"
                description={noticiaDesc} border="border-primary" iconColor="text-primary"
                externalHref={noticia.data?.link ?? null} loading={noticia.loading} />
            </div>
          </div>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
