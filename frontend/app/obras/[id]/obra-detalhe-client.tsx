'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ── Mock Data ── */
const obra = {
  id: 1,
  titulo: 'Reforma da Unidade de Saúde Central',
  status: 'em_andamento' as const,
  statusLabel: 'Em Andamento',
  contrato: 'Contrato nº 042/2023',
  descricao:
    'Reforma completa da unidade de saúde central, incluindo ampliação do pronto-socorro, modernização dos consultórios médicos e instalação de novos equipamentos. A obra visa melhorar significativamente o atendimento primário à saúde do município.',
  progressoFisico: 65,
  progressoFinanceiro: 52,
  orgao: 'Prefeitura Municipal',
  secretaria: 'Secretaria de Saúde',
  tipoObra: 'Reforma',
  modalidade: 'Concorrência',
  valorOriginal: 'R$ 1.000.000,00',
  valorAditivo: 'R$ 200.000,00',
  valorTotal: 'R$ 1.200.000,00',
  fonteRecurso: 'Recurso Municipal',
  dataInicio: '20/01/2024',
  previsaoTermino: '20/12/2024',
  diasRestantes: 243,
};

/* ── Galeria de Fotos ── */
const fotos = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    alt: 'Fachada da unidade de saúde em reforma',
    legenda: 'Fachada principal',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    alt: 'Interior do prédio em obras',
    legenda: 'Área interna',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
    alt: 'Equipamentos e andaimes',
    legenda: 'Estrutura metálica',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
    alt: 'Vista aérea da obra',
    legenda: 'Vista aérea',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    alt: 'Detalhes do acabamento',
    legenda: 'Acabamento',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1590644365607-1c5a0a1e9b9c?w=800&q=80',
    alt: 'Equipe de trabalho na obra',
    legenda: 'Equipe',
  },
];

/* ── Valores Medidos ── */
const valoresMedidos = [
  { mes: 'Janeiro', valor: 'R$ 50.000,00' },
  { mes: 'Fevereiro', valor: 'R$ 120.000,00' },
  { mes: 'Março', valor: 'R$ 180.000,00' },
  { mes: 'Abril (Atual)', valor: 'R$ 210.000,00', atual: true },
];

/* ── Photo Gallery Component ── */
function PhotoGallery() {
  const [selected, setSelected] = useState(0);

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
      <h3 className="font-headline text-xl font-bold text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined">photo_library</span>
        Galeria de Fotos
      </h3>

      {/* Foto Principal */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-surface-container-high mb-4">
        <Image
          src={fotos[selected].src}
          alt={fotos[selected].alt}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover transition-opacity duration-300"
          unoptimized
        />
        {/* Legenda sobre a imagem */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4 z-10">
          <p className="font-label text-sm font-medium text-white">
            {fotos[selected].legenda}
          </p>
        </div>
        {/* Contador */}
        <span className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-label text-white z-10">
          {selected + 1} / {fotos.length}
        </span>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {fotos.map((foto, i) => (
          <button
            key={foto.id}
            onClick={() => setSelected(i)}
            className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
              selected === i
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest dark:ring-offset-slate-900'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Image
              src={foto.src}
              alt={foto.alt}
              fill
              sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, 10vw"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Component ── */
export default function ObraDetalheClient({ id: _id }: { id: string }) {
  void _id; // reservado para busca futura por ID
  return (
    <div className="space-y-8">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 font-label text-sm">
        <Link
          href="/obras"
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Obras
        </Link>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">
          chevron_right
        </span>
        <span className="text-primary font-medium truncate max-w-[260px]">
          {obra.titulo}
        </span>
      </nav>

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container dark:from-slate-800 dark:to-slate-700 p-8 md:p-12 shadow-[0_32px_32px_-4px_rgba(0,25,60,0.08)] dark:shadow-none">
        {/* Decorative Pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">
                published_with_changes
              </span>
              {obra.statusLabel}
            </span>
            <span className="text-primary-fixed-dim text-sm font-medium">
              {obra.contrato}
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-on-primary tracking-tight mb-4 leading-tight">
            {obra.titulo}
          </h1>
          <p className="font-body text-base md:text-lg text-primary-fixed-dim max-w-2xl leading-relaxed">
            {obra.descricao}
          </p>
        </div>
      </div>

      {/* ── Bento Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column (8 cols) ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Progress Indicators */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h3 className="font-headline text-2xl font-bold text-primary mb-6">
              Indicadores de Progresso
            </h3>
            <div className="space-y-8">
              {/* Físico */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="font-label text-base font-medium text-on-surface-variant">
                    Avanço Físico
                  </span>
                  <span className="font-headline text-4xl font-black text-primary">
                    {obra.progressoFisico}%
                  </span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${obra.progressoFisico}%` }}
                  />
                </div>
              </div>
              {/* Financeiro */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="font-label text-base font-medium text-on-surface-variant">
                    Avanço Financeiro
                  </span>
                  <span className="font-headline text-4xl font-black text-primary">
                    {obra.progressoFinanceiro}%
                  </span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${obra.progressoFinanceiro}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Galeria de Fotos */}
          <PhotoGallery />

          {/* Valores Medidos */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h3 className="font-headline text-xl font-bold text-primary mb-6">
              Valores Medidos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {valoresMedidos.map((item) => (
                <div
                  key={item.mes}
                  className={`flex flex-col gap-1 p-5 rounded-xl transition-colors ${
                    item.atual
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 relative overflow-hidden'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  {item.atual && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  )}
                  <span
                    className={`font-label text-sm ${
                      item.atual
                        ? 'text-teal-600 dark:text-teal-400 font-bold mt-1'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {item.mes}
                  </span>
                  <span
                    className={`font-body text-xl font-semibold ${
                      item.atual
                        ? 'text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-primary'
                    }`}
                  >
                    {item.valor}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column (4 cols) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Informações Gerais */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h4 className="font-headline text-lg font-bold text-primary mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                info
              </span>
              Informações Gerais
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Órgão Responsável', value: obra.orgao },
                { label: 'Secretaria', value: obra.secretaria },
                { label: 'Tipo de Obra', value: obra.tipoObra },
                { label: 'Modalidade', value: obra.modalidade },
              ].map((item) => (
                <div key={item.label}>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                    {item.label}
                  </span>
                  <p className="font-body text-sm font-medium text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h4 className="font-headline text-lg font-bold text-primary mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                payments
              </span>
              Valores
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Valor Original', value: obra.valorOriginal },
                { label: 'Valor Aditivo', value: obra.valorAditivo },
                { label: 'Valor Total', value: obra.valorTotal, highlight: true },
                { label: 'Fonte de Recurso', value: obra.fonteRecurso },
              ].map((item) => (
                <div key={item.label}>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                    {item.label}
                  </span>
                  <p
                    className={`font-body text-sm font-medium ${
                      item.highlight
                        ? 'text-secondary dark:text-secondary-300 font-bold text-base'
                        : 'text-primary'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Prazos */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h4 className="font-headline text-lg font-bold text-primary mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                schedule
              </span>
              Prazos
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Data de Início', value: obra.dataInicio },
                {
                  label: 'Previsão de Conclusão',
                  value: obra.previsaoTermino,
                },
              ].map((item) => (
                <div key={item.label}>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                    {item.label}
                  </span>
                  <p className="font-body text-sm font-semibold text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
              {/* Dias Restantes - Highlight */}
              <div className="bg-surface-container-low rounded-xl p-4 mt-4">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                  Dias Restantes
                </span>
                <p className="font-headline text-2xl font-extrabold text-secondary dark:text-secondary-300">
                  {obra.diasRestantes}
                </p>
                <p className="font-label text-xs text-on-surface-variant mt-1">
                  dias até a conclusão prevista
                </p>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_16px_-2px_rgba(0,25,60,0.05)] dark:shadow-none">
            <h4 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                folder
              </span>
              Documentos
            </h4>
            <div className="flex flex-col gap-3">
              {[
                { icon: 'assignment', label: 'Boletins de Medição' },
                { icon: 'analytics', label: 'Relatório Executivo' },
                { icon: 'picture_as_pdf', label: 'Contrato Original' },
              ].map((doc) => (
                <button
                  key={doc.label}
                  className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl group hover:bg-surface-container-high transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">
                      {doc.icon}
                    </span>
                    <span className="font-label text-sm font-medium text-primary">
                      {doc.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
