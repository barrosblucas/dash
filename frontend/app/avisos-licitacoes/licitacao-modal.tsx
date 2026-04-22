/**
 * Modal de detalhes da licitação
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Icon from '@/components/ui/Icon';
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
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto elevated-card animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="description" size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-on-surface truncate">{item.numero}</h3>
              <div className="flex items-center gap-2 mt-1">
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Objeto */}
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Objeto</p>
            <p className="text-sm text-on-surface leading-relaxed">{item.objeto}</p>
          </div>

          {/* Detalhes em grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Modalidade</p>
              <p className="text-sm text-on-surface">{item.modalidade}</p>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Data de Abertura</p>
              <p className="text-sm text-on-surface">
                {format(item.dataAbertura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {item.orgaoNome && (
              <div className="col-span-2">
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Órgão</p>
                <p className="text-sm text-on-surface">{item.orgaoNome}</p>
              </div>
            )}
            {item.dataJulgamento && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Data de Julgamento</p>
                <p className="text-sm text-on-surface">
                  {format(item.dataJulgamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {item.disputa && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Disputa</p>
                <p className="text-sm text-on-surface">{item.disputa}</p>
              </div>
            )}
            {item.criterio && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Critério</p>
                <p className="text-sm text-on-surface">{item.criterio}</p>
              </div>
            )}
            {item.tipo && (
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Tipo</p>
                <p className="text-sm text-on-surface">{item.tipo}</p>
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
              <div className="pt-4">
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Informações do Processo</p>
                <div className="grid grid-cols-2 gap-3">
                  {detail.numProcesso && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Processo</p>
                      <p className="text-sm text-on-surface">{detail.numProcesso}</p>
                    </div>
                  )}
                  {detail.fase && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Fase</p>
                      <p className="text-sm text-on-surface">{detail.fase}</p>
                    </div>
                  )}
                  {detail.tipoDisputa && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Disputa</p>
                      <p className="text-sm text-on-surface">{detail.tipoDisputa.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {detail.modoDisputa && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Modo de Disputa</p>
                      <p className="text-sm text-on-surface">{detail.modoDisputa}</p>
                    </div>
                  )}
                  {detail.pregoeiro && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Pregoeiro</p>
                      <p className="text-sm text-on-surface">{detail.pregoeiro}</p>
                    </div>
                  )}
                  {detail.legislacao && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-0.5">Legislação</p>
                      <p className="text-sm text-on-surface">{detail.legislacao}</p>
                    </div>
                  )}
                </div>
              </div>

              {(detail.dataIniEnvioProposta || detail.dataFimEnvioProposta) && (
                <div className="pt-4">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Datas de Envio de Propostas</p>
                  <div className="grid grid-cols-2 gap-3">
                    {detail.dataIniEnvioProposta && (
                      <div>
                        <p className="text-xs text-on-surface-variant mb-0.5">Início</p>
                        <p className="text-sm text-on-surface">{fmtIsoDate(detail.dataIniEnvioProposta)}</p>
                      </div>
                    )}
                    {detail.dataFimEnvioProposta && (
                      <div>
                        <p className="text-xs text-on-surface-variant mb-0.5">Fim</p>
                        <p className="text-sm text-on-surface">{fmtIsoDate(detail.dataFimEnvioProposta)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documentos */}
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
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <Icon name="download" size={18} className="text-tertiary flex-shrink-0" />
                        <span className="text-sm text-on-surface truncate">{doc.arquivoNome || doc.tipo}</span>
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
            className="flex-1 btn-ghost text-sm"
          >
            <Icon name="open_in_new" size={18} />
            Ver processo na íntegra
          </a>
          {editalUrl ? (
            <a
              href={editalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-secondary text-sm"
            >
              <Icon name="download" size={18} />
              Download Edital
            </a>
          ) : (
            <button
              className="flex-1 btn-ghost text-sm"
              onClick={() => {
                window.open(item.urlProcesso || item.urlExterna, '_blank');
              }}
            >
              <Icon name="download" size={18} />
              Download Edital
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
