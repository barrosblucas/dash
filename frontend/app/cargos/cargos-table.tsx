'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { CargoItem, CargoResumoCategoria } from '@/types/cargo';
import type { SortField, SortDir } from './cargos-hooks';

/* ── Shared Badges ── */

export function CategoriaBadge({ categoria }: { categoria: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    EFETIVO: { bg: 'bg-[#22c55e18]', text: 'text-[#22c55e]', label: 'Efetivo' },
    CONTRATADOS: { bg: 'bg-[#06b6d418]', text: 'text-[#06b6d4]', label: 'Contratados' },
    COMISSIONADO: { bg: 'bg-[#a855f718]', text: 'text-[#a855f7]', label: 'Comissionado' },
    CONVOCADOS: { bg: 'bg-[#f9731618]', text: 'text-[#f97316]', label: 'Convocados' },
    ELETIVO: { bg: 'bg-[#f43f5e18]', text: 'text-[#f43f5e]', label: 'Eletivo' },
  };
  const style =
    map[categoria] || { bg: 'bg-[#6366f118]', text: 'text-[#6366f1]', label: categoria };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export function OcupacaoBadge({
  ocupadas,
  totais,
}: {
  ocupadas: number;
  totais: number;
}) {
  const percent = totais > 0 ? Math.round((ocupadas / totais) * 100) : 0;
  const color =
    percent >= 90
      ? 'text-[#22c55e] bg-[#22c55e18]'
      : percent >= 60
        ? 'text-[#06b6d4] bg-[#06b6d418]'
        : percent >= 30
          ? 'text-[#f97316] bg-[#f9731618]'
          : 'text-[#f43f5e] bg-[#f43f5e18]';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-label-md font-medium ${color}`}>
      {ocupadas}/{totais} ({percent}%)
    </span>
  );
}

/* ── Desktop Table ── */

export function CargosDesktopTable({
  categoriasOrdenadas,
  groupedByCategoria,
  getCategoriaResumo,
  getCategoriaIcon,
  getCategoriaColor,
  sortField,
  sortDir,
  onSort,
  expandedCategoria,
  onToggleCategoria,
  expandedCargo,
  onToggleCargo,
}: {
  categoriasOrdenadas: string[];
  groupedByCategoria: Record<string, CargoItem[]>;
  getCategoriaResumo: (categoria: string) => CargoResumoCategoria | undefined;
  getCategoriaIcon: (categoria: string) => string;
  getCategoriaColor: (categoria: string) => string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  expandedCategoria: Record<string, boolean>;
  onToggleCategoria: (categoria: string) => void;
  expandedCargo: string | null;
  onToggleCargo: (cargo: string) => void;
}) {
  return (
    <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-label-md text-on-surface-variant uppercase tracking-wider">
            <Th sortField="cargo" current={sortField} dir={sortDir} onClick={onSort}>
              Cargo
            </Th>
            <Th sortField="carga_horaria" current={sortField} dir={sortDir} onClick={onSort}>
              Carga Horária
            </Th>
            <Th
              sortField="vagas_totais"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Vagas Totais
            </Th>
            <Th
              sortField="vagas_ocupadas"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Vagas Ocupadas
            </Th>
            <Th
              sortField="salario_base"
              current={sortField}
              dir={sortDir}
              onClick={onSort}
              align="right"
            >
              Salário Base
            </Th>
            <Th sortField="categoria" current={sortField} dir={sortDir} onClick={onSort}>
              Categoria
            </Th>
            <th className="py-3 px-4 text-right">
              <span className="text-on-surface-variant">Ocupação</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categoriasOrdenadas.map((categoria) => {
            const items = groupedByCategoria[categoria];
            const resumoCat = getCategoriaResumo(categoria);
            return (
              <CategoriaTableGroup
                key={categoria}
                categoria={categoria}
                items={items}
                resumo={resumoCat}
                icon={getCategoriaIcon(categoria)}
                colorClass={getCategoriaColor(categoria)}
                isExpanded={expandedCategoria[categoria] ?? true}
                onToggleGroup={() => onToggleCategoria(categoria)}
                expandedCargo={expandedCargo}
                onToggleCargo={onToggleCargo}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Table Header ── */

interface ThProps {
  sortField: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (field: SortField) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

function Th({ sortField, current, dir, onClick, children, align = 'left' }: ThProps) {
  return (
    <th
      className={`py-3 px-4 cursor-pointer hover:text-on-surface transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onClick(sortField)}
    >
      {children} {current === sortField && (dir === 'asc' ? ' \u2191' : ' \u2193')}
    </th>
  );
}

/* ── Table Row Components ── */

function CategoriaTableGroup({
  categoria,
  items,
  resumo,
  icon,
  colorClass,
  isExpanded,
  onToggleGroup,
  expandedCargo,
  onToggleCargo,
}: {
  categoria: string;
  items: CargoItem[];
  resumo?: CargoResumoCategoria;
  icon: string;
  colorClass: string;
  isExpanded: boolean;
  onToggleGroup: () => void;
  expandedCargo: string | null;
  onToggleCargo: (cargo: string) => void;
}) {
  const labelMap: Record<string, string> = {
    EFETIVO: 'Efetivo',
    CONTRATADOS: 'Contratados',
    COMISSIONADO: 'Comissionado',
    CONVOCADOS: 'Convocados',
    ELETIVO: 'Eletivo',
  };

  return (
    <>
      {/* Categoria header row */}
      <tr
        className="bg-surface-container/50 hover:bg-surface-container transition-colors cursor-pointer border-t border-outline/10"
        onClick={onToggleGroup}
      >
        <td colSpan={7} className="py-3 px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-on-surface capitalize">
                {labelMap[categoria] || categoria.toLowerCase()}
              </span>
              {resumo && (
                <span className="text-xs text-on-surface-variant ml-3">
                  {resumo.quantidade_cargos} cargos · R$ {formatCurrency(resumo.total_salario_base)}{' '}
                  total
                </span>
              )}
            </div>
          </div>
        </td>
      </tr>
      {/* Items within group */}
      {isExpanded &&
        items.map((item, i) => (
          <CargoTableRow
            key={`${item.cargo}-${i}`}
            item={item}
            isExpanded={expandedCargo === item.cargo}
            onToggle={() => onToggleCargo(item.cargo)}
          />
        ))}
    </>
  );
}

function CargoTableRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: CargoItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-surface-container transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <span className="text-sm text-on-surface font-medium">{item.cargo}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-on-surface-variant">{item.carga_horaria || '-'}</span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface font-medium">
            {formatNumber(item.vagas_totais)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm text-on-surface font-medium">
            {formatNumber(item.vagas_ocupadas)}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold text-on-surface">
            {formatCurrency(item.salario_base)}
          </span>
        </td>
        <td className="py-3 px-4">
          <CategoriaBadge categoria={item.categoria} />
        </td>
        <td className="py-3 px-4 text-right">
          <OcupacaoBadge ocupadas={item.vagas_ocupadas} totais={item.vagas_totais} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface-container/50">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              <span>
                <span className="font-medium text-on-surface">Efetivos:</span> {item.efetivo}
              </span>
              <span>
                <span className="font-medium text-on-surface">Comissionados:</span>{' '}
                {item.comissionado}
              </span>
              <span>
                <span className="font-medium text-on-surface">Contratados:</span> {item.contratado}
              </span>
              <span>
                <span className="font-medium text-on-surface">Convocados:</span> {item.convocados}
              </span>
              <span>
                <span className="font-medium text-on-surface">Eletivos:</span> {item.eletivo}
              </span>
              <span>
                <span className="font-medium text-on-surface">Carga Horária:</span>{' '}
                {item.carga_horaria || '-'}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
