'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const PAGE_SIZE = 10;

export default function MedicamentosClient() {
  const [search, setSearch] = useState('');
  const [estabelecimento, setEstabelecimento] = useState('');
  const [page, setPage] = useState(1);

  const stockQuery = useQuery({
    queryKey: ['saude', 'medication-stock', search, estabelecimento, page],
    queryFn: () =>
      saudeService.getMedicationStock({
        search: search || undefined,
        estabelecimento: estabelecimento || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  if (stockQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando estoque de medicamentos..." />;
  }

  if (stockQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar estoque" description={stockQuery.error.message} />;
  }

  const totalPages = stockQuery.data ? Math.max(1, Math.ceil(stockQuery.data.total / stockQuery.data.page_size)) : 1;

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="Estoque público"
        title="Estoque público de medicamentos"
        description="Consulta operacional por estabelecimento com destaque visual para itens abaixo do mínimo. Os indicadores de farmácia agora ficam em um painel separado."
        badgeValue={<SaudeSyncBadge value={stockQuery.data?.last_synced_at} />}
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-3">
        <SaudeMetricCard label="Itens filtrados" value={formatNumber(stockQuery.data?.total ?? 0, { decimals: 0 })} icon="inventory_2" />
        <SaudeMetricCard
          label="Abaixo do mínimo"
          value={formatNumber(stockQuery.data?.total_abaixo_minimo ?? 0, { decimals: 0 })}
          supportingText="Sinaliza risco de reposição para a rede."
          tone="warning"
          icon="warning"
        />
        <SaudeMetricCard
          label="Página atual"
          value={`${stockQuery.data?.page ?? 1} / ${totalPages}`}
          supportingText="Navegação paginada para conjuntos extensos."
          icon="view_day"
        />
      </section>

      <SaudePanel
        title="Filtrar medicamentos"
        description="Busque por nome do item e refine por estabelecimento antes de abrir a tabela."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar medicamento"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <input
            value={estabelecimento}
            onChange={(event) => {
              setEstabelecimento(event.target.value);
              setPage(1);
            }}
            placeholder="Filtrar por estabelecimento"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setEstabelecimento('');
              setPage(1);
            }}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
          >
            Limpar filtros
          </button>
        </div>
      </SaudePanel>

      <SaudePanel
        title="Tabela de estoque"
        description="Cada linha mostra a situação atual do item por estabelecimento e reforça visualmente os itens abaixo do mínimo."
      >
        <div className="overflow-hidden rounded-[24px] border border-outline/10">
          <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] gap-4 bg-surface-container-lowest px-6 py-4 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
            <span>Medicamento</span>
            <span>Estoque</span>
            <span>Mínimo</span>
            <span>Estabelecimento</span>
          </div>
          {stockQuery.data?.items.length ? (
            stockQuery.data.items.map((item) => (
              <div
                key={`${item.product_name}-${item.establishment}`}
                className={`grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] gap-4 border-t border-outline/10 px-6 py-4 text-sm ${
                  item.below_minimum ? 'bg-red-500/5' : 'bg-transparent'
                }`}
              >
                <div>
                  <p className="font-semibold text-primary">{item.product_name}</p>
                  <p className="text-xs text-on-surface-variant">{item.department ?? 'Departamento não informado'}</p>
                </div>
                <p className={item.below_minimum ? 'font-bold text-red-300' : 'text-on-surface'}>{item.in_stock}</p>
                <p className="text-on-surface">{item.minimum_stock ?? '-'}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-on-surface">{item.establishment ?? '-'}</p>
                  {item.below_minimum ? (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300">Abaixo</span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <SaudeStateBlock type="empty" title="Nenhum medicamento encontrado" />
            </div>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-outline/10 px-6 py-4 text-sm text-on-surface-variant">
            <p>
              Página {stockQuery.data?.page ?? 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-xl bg-surface-container-lowest px-3 py-2 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-xl bg-surface-container-lowest px-3 py-2 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </SaudePanel>
    </div>
  );
}
