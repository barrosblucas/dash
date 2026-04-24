'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import {
  SaudeMetricCard,
  SaudePageHeader,
  SaudePanel,
  SaudeUnavailablePanel,
} from '@/components/saude/SaudePageSection';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { hasChartData } from '@/lib/saude-utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';
import type { SaudeHospitalCenso, SaudeLabelValueItem, SaudeMonthlySeriesItem } from '@/types/saude';

export default function HospitalClient() {
  const [estabelecimentoId, setEstabelecimentoId] = useState('');

  const hospitalQuery = useQuery({
    queryKey: ['saude', 'hospital', estabelecimentoId],
    queryFn: () =>
      saudeService.getHospitalDashboard({
        estabelecimento_id: estabelecimentoId ? Number(estabelecimentoId) : undefined,
      }),
  });

  if (hospitalQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando painel hospitalar..." />;
  }

  if (hospitalQuery.error instanceof Error) {
    return <SaudeStateBlock type="error" title="Falha ao carregar hospital" description={hospitalQuery.error.message} />;
  }

  const censo = hospitalQuery.data?.censo ?? null;
  const unavailableResources = hospitalQuery.data?.unavailable_resources ?? [];

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="US-09"
        title="Capacidade e produção hospitalar"
        description="Leitura consolidada do censo de leitos, internações, permanência e procedimentos hospitalares. Quando a fonte externa não envia um bloco, o painel deixa isso explícito."
        badgeValue={<SaudeSyncBadge value={hospitalQuery.data?.last_synced_at} />}
        actions={
          <input
            type="number"
            min="1"
            value={estabelecimentoId}
            onChange={(event) => setEstabelecimentoId(event.target.value)}
            placeholder="Filtrar por estabelecimento ID"
            className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          />
        }
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CensoMetric label="Leitos totais" value={censo?.total_leitos} />
        <CensoMetric label="Leitos ocupados" value={censo?.ocupados} tone="warning" />
        <CensoMetric label="Leitos livres" value={censo?.livres} tone="success" />
        <SaudeMetricCard
          label="Taxa de ocupação"
          value={censo && typeof censo.taxa_ocupacao === 'number' ? formatPercent(censo.taxa_ocupacao) : 'Indisponível'}
          supportingText={
            censo && typeof censo.taxa_ocupacao === 'number'
              ? 'Percentual calculado pela fonte externa.'
              : 'Bloco de censo indisponível na origem.'
          }
          tone={censo && typeof censo.taxa_ocupacao === 'number' ? 'info' : 'warning'}
          icon="monitoring"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Censo de leitos" description="Resumo estrutural de capacidade hospitalar.">
          {censo ? (
            <CensoSummary censo={censo} />
          ) : (
            <SaudeUnavailablePanel
              title="Censo indisponível"
              description="A fonte externa não retornou o bloco de leitos para o filtro atual."
            />
          )}
        </SaudePanel>

        <SaudePanel title="Movimento hospitalar por mês" description="Atendimentos hospitalares distribuídos ao longo do tempo.">
          <MonthlySeriesOrUnavailable
            items={hospitalQuery.data?.attendances_by_month ?? []}
            emptyTitle="Movimento mensal indisponível"
            emptyDescription="A fonte externa não publicou atendimentos hospitalares por mês para este recorte."
          />
        </SaudePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Internações por mês" description="Volume de internações registradas em cada mês.">
          <MonthlySeriesOrUnavailable
            items={hospitalQuery.data?.internacoes_by_month ?? []}
            emptyTitle="Internações mensais indisponíveis"
            emptyDescription="A fonte externa não retornou o histórico mensal de internações."
          />
        </SaudePanel>

        <SaudePanel title="Tempo médio de permanência" description="Série do tempo médio de permanência informado pelo hospital.">
          <MonthlySeriesOrUnavailable
            items={hospitalQuery.data?.average_stay_by_month ?? []}
            emptyTitle="Permanência média indisponível"
            emptyDescription="A fonte externa não retornou esse bloco para o filtro atual."
            stroke="#f59e0b"
          />
        </SaudePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Internações por CID" description="Concentração de internações por CID informado pela origem.">
          <RankingOrUnavailable
            items={hospitalQuery.data?.internacoes_by_cid ?? []}
            emptyTitle="CID indisponível"
            emptyDescription="A fonte externa não retornou internações por CID para o recorte selecionado."
          />
        </SaudePanel>

        <SaudePanel title="Procedimentos hospitalares" description="Volume de procedimentos realizados e total consolidado do período.">
          {hasChartData(hospitalQuery.data?.procedures) ? (
            <div className="space-y-4">
              <SaudeMetricCard
                label="Total de procedimentos"
                value={formatNumber(hospitalQuery.data?.total_procedures ?? 0, { decimals: 0 })}
                supportingText="Soma consolidada do período."
                tone="success"
                icon="medical_services"
              />
              <RankingOrUnavailable
                items={hospitalQuery.data?.procedures ?? []}
                emptyTitle="Procedimentos indisponíveis"
                emptyDescription="A fonte externa não retornou os procedimentos hospitalares."
              />
            </div>
          ) : (
            <SaudeUnavailablePanel
              title="Procedimentos indisponíveis"
              description="A fonte externa não retornou esse bloco hospitalar no momento."
            />
          )}
        </SaudePanel>
      </section>

      {unavailableResources.length ? (
        <SaudePanel
          title="Blocos indisponíveis na fonte"
          description="Os recortes abaixo foram solicitados pelo PRD, mas a origem pública não respondeu para este município na verificação atual."
        >
          <div className="flex flex-wrap gap-3">
            {unavailableResources.map((resource) => (
              <span
                key={resource}
                className="rounded-full border border-outline/10 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant"
              >
                {resource}
              </span>
            ))}
          </div>
        </SaudePanel>
      ) : null}
    </div>
  );
}

function CensoMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | null | undefined;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <SaudeMetricCard
      label={label}
      value={typeof value === 'number' ? formatNumber(value, { decimals: 0 }) : 'Indisponível'}
      supportingText={typeof value === 'number' ? 'Valor retornado pela origem.' : 'Bloco indisponível na fonte externa.'}
      tone={typeof value === 'number' ? tone : 'warning'}
      icon="local_hospital"
    />
  );
}

function CensoSummary({ censo }: { censo: SaudeHospitalCenso }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[24px] border border-outline/10 bg-surface-container-lowest p-5">
        <p className="text-sm text-on-surface-variant">Leitos totais</p>
        <p className="mt-3 font-headline text-3xl font-bold text-primary">
          {typeof censo.total_leitos === 'number' ? formatNumber(censo.total_leitos, { decimals: 0 }) : 'Indisponível'}
        </p>
      </div>
      <div className="rounded-[24px] border border-outline/10 bg-surface-container-lowest p-5">
        <p className="text-sm text-on-surface-variant">Taxa de ocupação</p>
        <p className="mt-3 font-headline text-3xl font-bold text-tertiary">
          {typeof censo.taxa_ocupacao === 'number' ? formatPercent(censo.taxa_ocupacao) : 'Indisponível'}
        </p>
      </div>
    </div>
  );
}

function MonthlySeriesOrUnavailable({
  items,
  emptyTitle,
  emptyDescription,
  stroke = '#0f4c81',
}: {
  items: SaudeMonthlySeriesItem[];
  emptyTitle: string;
  emptyDescription: string;
  stroke?: string;
}) {
  if (!hasChartData(items)) {
    return <SaudeUnavailablePanel title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={items}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankingOrUnavailable({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: SaudeLabelValueItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!hasChartData(items)) {
    return <SaudeUnavailablePanel title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fill: 'currentColor', fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f4c81" radius={[0, 10, 10, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
