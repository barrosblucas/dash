/**
 * Modal de detalhes da licitação
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, X, Download, ExternalLink } from 'lucide-react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLicitacaoComprasBRDetail } from '@/hooks/useLicitacoes';
import type { LicitacaoUnified } from '@/types/licitacao';

import { FonteBadge } from './fonte-badge';
import { StatusBadge } from './status-badge';
import { fmtIsoDate } from './filters';

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

  // Documento edital para download
  const editalDoc = detail?.documentos?.find((d) => d.tipo === 'EDITAL');
  const editalUrl = editalDoc
    ? `https://app.comprasbr.com.br/licitacao/hal/public/arquivos?uri=${encodeURIComponent(editalDoc.arquivoUri)}&thumbnail=false`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-dark-700/50 bg-dark-800/95 backdrop-blur-sm shadow-xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-dark-700/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-dark-100 truncate">{item.numero}</h3>
              <div className="flex items-center gap-2 mt-1">
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-dark-700/60 transition-colors text-dark-400 hover:text-dark-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Objeto */}
          <div>
            <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Objeto</p>
            <p className="text-sm text-dark-200 leading-relaxed">{item.objeto}</p>
          </div>

          {/* Detalhes em grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Modalidade</p>
              <p className="text-sm text-dark-200">{item.modalidade}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Data de Abertura</p>
              <p className="text-sm text-dark-200">
                {format(item.dataAbertura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {item.orgaoNome && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Órgão</p>
                <p className="text-sm text-dark-200">{item.orgaoNome}</p>
              </div>
            )}
            {item.dataJulgamento && (
              <div>
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Data de Julgamento</p>
                <p className="text-sm text-dark-200">
                  {format(item.dataJulgamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {item.disputa && (
              <div>
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Disputa</p>
                <p className="text-sm text-dark-200">{item.disputa}</p>
              </div>
            )}
            {item.criterio && (
              <div>
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Critério</p>
                <p className="text-sm text-dark-200">{item.criterio}</p>
              </div>
            )}
            {item.tipo && (
              <div>
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-1">Tipo</p>
                <p className="text-sm text-dark-200">{item.tipo}</p>
              </div>
            )}
          </div>

          {/* ─── Detalhes ComprasBR ─── */}
          {isComprasBR && loadingDetail && (
            <div className="py-2">
              <LoadingSpinner size="sm" message="Carregando detalhes..." />
            </div>
          )}

          {isComprasBR && detail && (
            <div className="space-y-4">
              <div className="border-t border-dark-700/30 pt-4">
                <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">Informações do Processo</p>
                <div className="grid grid-cols-2 gap-3">
                  {detail.numProcesso && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Processo</p>
                      <p className="text-sm text-dark-200">{detail.numProcesso}</p>
                    </div>
                  )}
                  {detail.fase && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Fase</p>
                      <p className="text-sm text-dark-200">{detail.fase}</p>
                    </div>
                  )}
                  {detail.tipoDisputa && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Disputa</p>
                      <p className="text-sm text-dark-200">{detail.tipoDisputa.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {detail.modoDisputa && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Modo de Disputa</p>
                      <p className="text-sm text-dark-200">{detail.modoDisputa}</p>
                    </div>
                  )}
                  {detail.pregoeiro && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Pregoeiro</p>
                      <p className="text-sm text-dark-200">{detail.pregoeiro}</p>
                    </div>
                  )}
                  {detail.legislacao && (
                    <div>
                      <p className="text-xs text-dark-500 mb-0.5">Legislação</p>
                      <p className="text-sm text-dark-200">{detail.legislacao}</p>
                    </div>
                  )}
                </div>
              </div>

              {(detail.dataIniEnvioProposta || detail.dataFimEnvioProposta) && (
                <div className="border-t border-dark-700/30 pt-4">
                  <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">Datas de Envio de Propostas</p>
                  <div className="grid grid-cols-2 gap-3">
                    {detail.dataIniEnvioProposta && (
                      <div>
                        <p className="text-xs text-dark-500 mb-0.5">Início</p>
                        <p className="text-sm text-dark-200">{fmtIsoDate(detail.dataIniEnvioProposta)}</p>
                      </div>
                    )}
                    {detail.dataFimEnvioProposta && (
                      <div>
                        <p className="text-xs text-dark-500 mb-0.5">Fim</p>
                        <p className="text-sm text-dark-200">{fmtIsoDate(detail.dataFimEnvioProposta)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documentos */}
              {detail.documentos && detail.documentos.length > 0 && (
                <div className="border-t border-dark-700/30 pt-4">
                  <p className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">Documentos</p>
                  <div className="space-y-2">
                    {detail.documentos.map((doc) => (
                      <a
                        key={doc.id}
                        href={`https://app.comprasbr.com.br/licitacao/hal/public/arquivos?uri=${encodeURIComponent(doc.arquivoUri)}&thumbnail=false`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors"
                      >
                        <Download className="w-4 h-4 text-forecast-400 flex-shrink-0" />
                        <span className="text-sm text-dark-200 truncate">{doc.arquivoNome || doc.tipo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-dark-700/50">
          <a
            href={item.urlProcesso || item.urlExterna}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forecast-500/15 text-forecast-400 text-sm font-medium hover:bg-forecast-500/25 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver processo na íntegra
          </a>
          {editalUrl ? (
            <a
              href={editalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/15 text-green-400 text-sm font-medium hover:bg-green-500/25 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Edital
            </a>
          ) : (
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-dark-700/60 text-dark-300 text-sm font-medium hover:bg-dark-700 transition-colors"
              onClick={() => {
                window.open(item.urlProcesso || item.urlExterna, '_blank');
              }}
            >
              <Download className="w-4 h-4" />
              Download Edital
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
