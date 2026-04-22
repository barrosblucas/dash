/**
 * Visualização em lista de licitações
 * Design: card grid + table, The Architectural Archive
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      {/* Empty state */}
      {pagedListItems.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-ambient">
          <span className="material-symbols-outlined text-outline text-[40px] block mx-auto mb-3">calendar_today</span>
          <p className="text-on-surface-variant font-medium mb-1">Nenhuma licitação encontrada</p>
          <p className="text-sm text-on-surface-variant/60">
            {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
          </p>
        </div>
      )}

      {/* Desktop: table */}
      {pagedListItems.length > 0 && (
        <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
                <th className="text-left py-3 px-4">Nº Edital / Processo</th>
                <th className="text-left py-3 px-4">Objeto</th>
                <th className="text-left py-3 px-4">Fonte</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Data Abertura</th>
                <th className="text-right py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedListItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-container transition-colors cursor-pointer"
                  onClick={() => onOpenModal(item)}
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-on-surface">{item.numero}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-sm text-on-surface-variant truncate">{item.objeto}</p>
                  </td>
                  <td className="py-3 px-4">
                    <FonteBadge fonte={item.fonte} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-on-surface-variant">
                      {format(item.dataAbertura, 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={item.urlProcesso || item.urlExterna}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-tertiary dark:text-amber-400 hover:text-tertiary-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Ver processo
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile + md: card grid */}
      {pagedListItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
          {pagedListItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenModal(item)}
              className="w-full text-left bg-surface-container-lowest rounded-xl p-5 shadow-ambient transition-all duration-200 hover:shadow-ambient-lg"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-on-surface">{item.numero}</span>
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                {extrairTituloSucinto(item.objeto) || item.objeto}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/60">
                  {format(item.dataAbertura, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">open_in_new</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-on-surface-variant/60">
            Mostrando {listPage * PAGE_SIZE + 1}–{Math.min((listPage + 1) * PAGE_SIZE, sortedListItems.length)} de{' '}
            {sortedListItems.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetListPage(Math.max(0, listPage - 1))}
              disabled={listPage === 0}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => Math.abs(p - listPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onSetListPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-medium transition-colors ${
                    p === listPage
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p + 1}
                </button>
              ))}
            <button
              onClick={() => onSetListPage(Math.min(totalPages - 1, listPage + 1))}
              disabled={listPage >= totalPages - 1}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
