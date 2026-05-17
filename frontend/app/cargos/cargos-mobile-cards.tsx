'use client';

import { formatCurrency } from '@/lib/utils';
import type { CargoItem, CargoResumoCategoria } from '@/types/cargo';

import { OcupacaoBadge } from './cargos-table';

/* ── Mobile Components ── */

export function CargosMobileCards({
  categoriasOrdenadas,
  groupedByCategoria,
  getCategoriaResumo,
  getCategoriaIcon,
  getCategoriaColor,
  expandedCargo,
  onToggleCargo,
}: {
  categoriasOrdenadas: string[];
  groupedByCategoria: Record<string, CargoItem[]>;
  getCategoriaResumo: (categoria: string) => CargoResumoCategoria | undefined;
  getCategoriaIcon: (categoria: string) => string;
  getCategoriaColor: (categoria: string) => string;
  expandedCargo: string | null;
  onToggleCargo: (cargo: string) => void;
}) {
  if (categoriasOrdenadas.length === 0) {
    return (
      <div className="space-y-3 lg:hidden">
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-ambient">
          <span className="material-symbols-outlined text-outline text-[32px] block mx-auto mb-2">
            search_off
          </span>
          <p className="text-on-surface-variant">Nenhum cargo encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:hidden">
      {categoriasOrdenadas.map((categoria) => {
        const items = groupedByCategoria[categoria];
        const resumoCat = getCategoriaResumo(categoria);
        return (
          <CategoriaMobileGroup
            key={categoria}
            categoria={categoria}
            items={items}
            resumo={resumoCat}
            icon={getCategoriaIcon(categoria)}
            colorClass={getCategoriaColor(categoria)}
            expandedCargo={expandedCargo}
            onToggleCargo={onToggleCargo}
          />
        );
      })}
    </div>
  );
}

function CategoriaMobileGroup({
  categoria,
  items,
  resumo,
  icon,
  colorClass,
  expandedCargo,
  onToggleCargo,
}: {
  categoria: string;
  items: CargoItem[];
  resumo?: CargoResumoCategoria;
  icon: string;
  colorClass: string;
  expandedCargo: string | null;
  onToggleCargo: (cargo: string) => void;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container/50 border-b border-outline/10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface capitalize">
            {categoria.toLowerCase()}
          </p>
          {resumo && (
            <p className="text-xs text-on-surface-variant">
              {resumo.quantidade_cargos} cargos · {resumo.total_ocupados}/{resumo.total_vagas}{' '}
              vagas ocupadas
            </p>
          )}
        </div>
      </div>
      <div className="divide-y divide-outline/10">
        {items.map((item, i) => (
          <CargoMobileCard
            key={`${item.cargo}-${i}`}
            item={item}
            isExpanded={expandedCargo === item.cargo}
            onToggle={() => onToggleCargo(item.cargo)}
          />
        ))}
      </div>
    </div>
  );
}

function CargoMobileCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: CargoItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-surface-container-lowest/50 p-4 hover:bg-surface-container transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-on-surface truncate">{item.cargo}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{item.carga_horaria}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">
          <OcupacaoBadge ocupadas={item.vagas_ocupadas} totais={item.vagas_totais} />
        </span>
        <span className="text-sm font-semibold text-on-surface">
          {formatCurrency(item.salario_base)}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-1.5">
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Efetivos:</span> {item.efetivo}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Comissionados:</span> {item.comissionado}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Contratados:</span> {item.contratado}
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">Eletivos:</span> {item.eletivo}
          </p>
        </div>
      )}
    </div>
  );
}
