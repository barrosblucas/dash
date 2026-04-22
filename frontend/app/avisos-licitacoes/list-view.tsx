/**
 * Visualização em lista/tabela de licitações
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Icon from '@/components/ui/Icon';
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
        <div className="hidden lg:block surface-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
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
                      className="inline-flex items-center gap-1 text-xs text-tertiary hover:text-tertiary-600 transition-colors"
                    >
                      <Icon name="open_in_new" size={16} />
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
            <Icon name="calendar_today" size={40} className="text-outline mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium mb-1">Nenhuma licitação encontrada</p>
            <p className="text-sm text-on-surface-variant/60">
              {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
            </p>
          </div>
        ) : (
          pagedListItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenModal(item)}
              className="w-full text-left surface-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-on-surface">{item.numero}</span>
                <FonteBadge fonte={item.fonte} />
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">
                {extrairTituloSucinto(item.objeto) || item.objeto}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/60">
                  {format(item.dataAbertura, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Icon name="open_in_new" size={16} className="text-on-surface-variant" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop empty state */}
      {pagedListItems.length === 0 && (
        <div className="hidden lg:block text-center py-12">
          <Icon name="calendar_today" size={40} className="text-outline mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium mb-1">Nenhuma licitação encontrada</p>
          <p className="text-sm text-on-surface-variant/60">
            {searchTerm ? 'Tente ajustar o termo de busca.' : 'Nenhum processo licitatório registrado.'}
          </p>
        </div>
      )}

      {/* Paginação */}
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
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => Math.abs(p - listPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onSetListPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === listPage
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p + 1}
                </button>
              ))}
            <button
              onClick={() => onSetListPage(Math.min(totalPages - 1, listPage + 1))}
              disabled={listPage >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
