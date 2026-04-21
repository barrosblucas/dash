/**
 * Visualização em lista/tabela de licitações
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

import type { LicitacaoUnified } from '@/types/licitacao';

import { extrairTituloSucinto } from './parsers';
import { FonteBadge } from './fonte-badge';
import { StatusBadge } from './status-badge';

interface ListViewProps {
  pagedListItems: LicitacaoUnified[];
  sortedListItems: LicitacaoUnified[];
  totalPages: number;
  listPage: number;
  searchTerm: string;
  onSetListPage: (page: number) => void;
  onOpenModal: (item: LicitacaoUnified) => void;
}

export function ListView({
  pagedListItems,
  sortedListItems,
  totalPages,
  listPage,
  searchTerm,
  onSetListPage,
  onOpenModal,
}: ListViewProps) {
  const PAGE_SIZE = 15;

  return (
    <div className="space-y-4">
      {/* Desktop: Tabela */}
      {pagedListItems.length > 0 && (
        <div className="hidden lg:block rounded-xl border border-dark-700/50 bg-dark-800/30 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50 bg-dark-800/60">
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Nº Edital / Processo
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Objeto
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Fonte
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Data Abertura
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedListItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors cursor-pointer"
                  onClick={() => onOpenModal(item)}
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-sm text-dark-300 truncate">{item.objeto}</p>
                  </td>
                  <td className="py-3 px-4">
                    <FonteBadge fonte={item.fonte} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-300">
                      {format(item.dataAbertura, 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={item.urlProcesso || item.urlExterna}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-forecast-400 hover:text-forecast-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver processo
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile: Cards */}
      <div className="space-y-2 lg:hidden">
        {pagedListItems.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-10 h-10 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 font-medium mb-1">Nenhuma licitação encontrada</p>
            <p className="text-sm text-dark-500">
              {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
            </p>
          </div>
        ) : (
          pagedListItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenModal(item)}
              className="w-full text-left rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 hover:bg-dark-800/70 hover:border-dark-600/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-dark-200">{item.numero}</span>
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-dark-400 line-clamp-2 mb-2">
                {extrairTituloSucinto(item.objeto) || item.objeto}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-500">
                  {format(item.dataAbertura, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-dark-500" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop empty state */}
      {pagedListItems.length === 0 && (
        <div className="hidden lg:block text-center py-12">
          <CalendarIcon className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 font-medium mb-1">Nenhuma licitação encontrada</p>
          <p className="text-sm text-dark-500">
            {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
          </p>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-dark-500">
            Mostrando {listPage * PAGE_SIZE + 1}–{Math.min((listPage + 1) * PAGE_SIZE, sortedListItems.length)} de{' '}
            {sortedListItems.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetListPage(Math.max(0, listPage - 1))}
              disabled={listPage === 0}
              className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => Math.abs(p - listPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onSetListPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === listPage
                      ? 'bg-accent-500/20 text-accent-300'
                      : 'text-dark-400 hover:bg-dark-700/40'
                  }`}
                >
                  {p + 1}
                </button>
              ))}
            <button
              onClick={() => onSetListPage(Math.min(totalPages - 1, listPage + 1))}
              disabled={listPage >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-dark-700/40 text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
