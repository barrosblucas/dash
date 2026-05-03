'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

import { buscarLegislacao, downloadLegislacao, importarLegislacao } from '@/services/legislacao-municipal-service';
import type { LegislacaoBuscaItem, LegislacaoBuscaResponse } from '@/types/legislacao-municipal';
import type { LegislacaoDetalhe } from '@/types/legislacao';

function toApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function todayInputDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inferTipoFromTitulo(titulo: string): string {
  const upper = titulo.toUpperCase();
  const tipos = ['LEI COMPLEMENTAR', 'LEI', 'DECRETO LEI', 'DECRETO', 'PORTARIA', 'RESOLUÇÃO', 'RESOLUCAO', 'EMENDA'];
  for (const tipo of tipos) {
    if (upper.startsWith(tipo)) {
      return tipo.replace(/\s/g, '_');
    }
  }
  return 'LEI';
}

export default function LegislacaoMunicipalAdminClient() {
  const [termo, setTermo] = useState('LEI');
  const [dataInicio, setDataInicio] = useState('2025-01-01');
  const [dataFim, setDataFim] = useState(todayInputDate);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [results, setResults] = useState<LegislacaoBuscaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<LegislacaoDetalhe | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const performSearch = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      setImportSuccess(null);
      setImportError(null);
      setDownloadError(null);

      try {
        const response = await buscarLegislacao({
          termo: termo || 'LEI',
          data_inicio: toApiDate(dataInicio),
          data_fim: toApiDate(dataFim),
          page: targetPage,
          size,
        });
        setResults(response);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar matérias.');
      } finally {
        setLoading(false);
      }
    },
    [termo, dataInicio, dataFim, size]
  );

  useEffect(() => {
    performSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  const handleImport = async (item: LegislacaoBuscaItem) => {
    setImportingId(item.id);
    setImportSuccess(null);
    setImportError(null);

    try {
      const result = await importarLegislacao({
        legislacao_id: item.id,
        titulo: item.titulo,
        data_publicacao: item.data_publicacao,
        numero_materia: item.numero_materia,
        link_legislacao: item.link_legislacao,
        link_diario_oficial: item.link_diario_oficial,
        numero_lei: item.numero_lei,
        ano_lei: item.ano_lei,
        tipo: inferTipoFromTitulo(item.titulo),
      });
      setImportSuccess(result);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar matéria.');
    } finally {
      setImportingId(null);
    }
  };

  const handleDownloadLegislacao = async (item: LegislacaoBuscaItem) => {
    setDownloadingId(item.id);
    setDownloadError(null);

    try {
      const blob = await downloadLegislacao({
        id: item.id,
        link_legislacao: item.link_legislacao,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legislacao_${item.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Erro ao baixar legislação.');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPages = results ? Math.ceil(results.total / results.size) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-headline text-2xl font-bold text-primary">Legislação Municipal</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Busque matérias legislativas individuais no Diário Oficial de MS e importe-as como legislação municipal.
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl bg-surface-container-low p-6 shadow-ambient">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="termo" className="mb-1 block text-sm font-medium text-on-surface">
              Termo de busca
            </label>
            <input
              id="termo"
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Ex: LEI, DECRETO, PORTARIA..."
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-full lg:w-48">
            <label htmlFor="dataInicio" className="mb-1 block text-sm font-medium text-on-surface">
              Data início
            </label>
            <input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-full lg:w-48">
            <label htmlFor="dataFim" className="mb-1 block text-sm font-medium text-on-surface">
              Data fim
            </label>
            <input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-dark disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {importSuccess && (
        <div className="rounded-xl bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>
              Legislação importada com sucesso:{' '}
              <Link
                href={`/legislacao/${importSuccess.id}`}
                className="font-semibold underline hover:text-tertiary"
              >
                {importSuccess.tipo} {importSuccess.numero}/{importSuccess.ano}
              </Link>
            </span>
          </div>
        </div>
      )}

      {importError && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {importError}
        </div>
      )}

      {downloadError && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {downloadError}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{results.total}</span> resultados encontrados
            </p>
            <p className="text-sm text-on-surface-variant">
              Página {results.page} de {totalPages || 1}
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low shadow-ambient overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-outline-variant text-left text-label-sm text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3 font-medium">Título</th>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Nº Lei</th>
                    <th className="px-6 py-3 font-medium">Anexo</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {results.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                        Nenhuma matéria encontrada.
                      </td>
                    </tr>
                  ) : (
                    results.items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-on-surface">{item.titulo}</p>
                          <p className="text-xs text-on-surface-variant">Matéria: {item.numero_materia}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">{item.data_publicacao}</td>
                        <td className="px-6 py-4 text-sm text-on-surface">
                          {item.numero_lei || <span className="text-on-surface-variant">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.anexo_habilitado ? (
                            <span className="inline-flex items-center rounded-full bg-tertiary-container px-2.5 py-0.5 text-xs font-medium text-on-tertiary-container">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (item.link_diario_oficial) {
                                  window.open(item.link_diario_oficial, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              disabled={!item.link_diario_oficial}
                              title={item.link_diario_oficial ? 'Baixar PDF do Diário Oficial' : 'Link de download não disponível'}
                              className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              Baixar PDF
                            </button>
                            <button
                              onClick={() => handleDownloadLegislacao(item)}
                              disabled={!item.link_legislacao || downloadingId === item.id}
                              title={item.link_legislacao ? 'Baixar apenas a legislação (PDF individual)' : 'Link de download não disponível'}
                              className="inline-flex items-center gap-1 rounded-lg bg-tertiary-container px-3 py-1.5 text-xs text-on-tertiary-container hover:bg-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {downloadingId === item.id ? 'sync' : 'description'}
                              </span>
                              {downloadingId === item.id ? 'Baixando...' : 'Legislação'}
                            </button>
                            <button
                              onClick={() => handleImport(item)}
                              disabled={importingId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:bg-primary-dark disabled:opacity-60"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {importingId === item.id ? 'sync' : 'upload'}
                              </span>
                              {importingId === item.id ? 'Importando...' : 'Importar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => performSearch(page - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Anterior
            </button>

            <span className="text-sm text-on-surface-variant">
              Página {page} de {totalPages || 1}
            </span>

            <button
              onClick={() => performSearch(page + 1)}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            >
              Próxima
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
