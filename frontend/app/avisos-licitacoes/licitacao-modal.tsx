'use client';

/**
 * Modal de detalhes da licitação
 * Design: glassmorphism with tonal layering
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLicitacaoComprasBRDetail } from '@/hooks/useLicitacoes';
import type { LicitacaoUnified } from '@/types/licitacao';

import { FonteBadge } from './fonte-badge';
import { StatusBadge } from './status-badge';

export function LicitacaoModal({
  item,
  onClose,
}: {
  item: LicitacaoUnified;
  onClose: () => void;
}) {
  const isComprasBR = item.fonte === 'comprasbr';
  const comprasbrId = isComprasBR ? Number(item.idOriginal) : null;
  const { data: detail, isLoading: loadingDetail } = useLicitacaoComprasBRDetail(comprasbrId);

  const editalDoc = detail?.documentos?.find((d) => d.tipo === 'EDITAL');
  const editalUrl = editalDoc
    ? `https://app.comprasbr.com.br/licitacao/hal/public/arquivos?uri=${encodeURIComponent(editalDoc.arquivoUri)}&thumbnail=false`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-ambient-lg animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary dark:text-blue-400 text-[20px]">description</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-on-surface dark:text-white truncate">{item.numero}</h3>
              <div className="flex items-center gap-2 mt-1">
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-700/40 transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Objeto */}
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Objeto</p>
            <p className="text-sm text-on-surface dark:text-slate-200 leading-relaxed">{item.objeto}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Modalidade</p>
              <p className="text-sm text-on-surface dark:text-slate-200">{item.modalidade}</p>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Data de Abertura</p>
              <p className="text-sm text-on-surface dark:text-slate-200">
                {format(item.dataAbertura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {item.orgaoNome && (
              <div className="col-span-2">
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Órgão</p>
                <p className="text-sm text-on-surface dark:text-slate-200">{item.orgaoNome}</p>
              </div>
            )}
            {item.dataJulgamento && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Data de Julgamento</p>
                <p className="text-sm text-on-surface dark:text-slate-200">
                  {format(item.dataJulgamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {item.disputa && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Disputa</p>
                <p className="text-sm text-on-surface dark:text-slate-200">{item.disputa}</p>
              </div>
            )}
            {item.criterio && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Critério</p>
                <p className="text-sm text-on-surface dark:text-slate-200">{item.criterio}</p>
              </div>
            )}
            {item.tipo && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Tipo</p>
                <p className="text-sm text-on-surface dark:text-slate-200">{item.tipo}</p>
              </div>
            )}
          </div>

          {/* ComprasBR Details */}
          {isComprasBR && loadingDetail && (
            <div className="py-2">
              <LoadingSpinner size="sm" message="Carregando detalhes..." />
            </div>
          )}

          {isComprasBR && detail && (
            <div className="space-y-4">
              {detail.documentos && detail.documentos.length > 0 && (
                <div className="pt-4">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Documentos</p>
                  <div className="space-y-2">
                    {detail.documentos.map((doc) => (
                      <a
                        key={doc.id}
                        href={`https://app.comprasbr.com.br/licitacao/hal/public/arquivos?uri=${encodeURIComponent(doc.arquivoUri)}&thumbnail=false`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low dark:bg-slate-800/30 hover:bg-surface-container dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-tertiary dark:text-amber-400 text-[18px] flex-shrink-0">download</span>
                        <span className="text-sm text-on-surface dark:text-slate-200 truncate">{doc.arquivoNome || doc.tipo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5">
          <a
            href={item.urlProcesso || item.urlExterna}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700/40 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Ver processo na íntegra
          </a>
          {editalUrl ? (
            <a
              href={editalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-on-secondary dark:bg-emerald-600 dark:text-white hover:bg-secondary/90 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Edital
            </a>
          ) : (
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700/40 transition-all duration-200"
              onClick={() => {
                window.open(item.urlProcesso || item.urlExterna, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Edital
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
