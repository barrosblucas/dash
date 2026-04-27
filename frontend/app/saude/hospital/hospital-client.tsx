'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import {
  SaudeMetricCard,
  SaudePageHeader,
  SaudePanel,
  SaudeUnavailablePanel,
} from '@/components/saude/SaudePageSection';
import SaudePeriodFilter from '@/components/saude/SaudePeriodFilter';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { getSaudePeriodRange, getYearFromDateInput, hasChartData, maxDate, saudeYearOptions } from '@/lib/saude-utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';
import type { SaudeHospitalCenso, SaudeLabelValueItem, SaudeMonthlySeriesItem } from '@/types/saude';

const MIN_START_DATE = '2020-01-01';
const defaultPeriod = getSaudePeriodRange(saudeYearOptions[0]);
const HEATMAP_HOURS = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}hr`);
const HEATMAP_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const unavailableLabels: Record<string, string> = {
  mapa_de_calor: 'Mapa de calor',
  internacoes_por_mes: 'Internações mensais',
  internacoes_por_cid: 'Internações por CID',
  media_permanencia: 'Tempo médio de permanência',
  nao_municipes: 'Não munícipes',
  especialidades_medicas: 'Especialidades médicas',
  outras_especialidades: 'Outras especialidades',
  procedimentos_realizados: 'Procedimentos realizados por especialidade',
  atendimentos_por_cid: 'Atendimentos por CID',
};

export default function HospitalClient() {
  const [year, setYear] = useState(saudeYearOptions[0]);
  const [startDate, setStartDate] = useState(maxDate(defaultPeriod.startDate, MIN_START_DATE));
  const [endDate, setEndDate] = useState(defaultPeriod.endDate);
  const [estabelecimentoId, setEstabelecimentoId] = useState('');

  const handleYearChange = (nextYear: number) => {
    setYear(nextYear);
    const period = getSaudePeriodRange(nextYear);
    setStartDate(maxDate(period.startDate, MIN_START_DATE));
    setEndDate(period.endDate);
  };

  const handleStartDateChange = (value: string) => {
    const clamped = maxDate(value, MIN_START_DATE);
    setStartDate(clamped);
    const nextYear = getYearFromDateInput(clamped);
    if (nextYear !== null) {
      setYear(nextYear);
    }
  };

  const hospitalQuery = useQuery({
    queryKey: ['saude', 'hospital', year, startDate, endDate, estabelecimentoId],
    placeholderData: keepPreviousData,
    queryFn: () =>
      saudeService.getHospitalDashboard({
        year,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
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
        eyebrow="Assistência hospitalar"
        title="Capacidade e produção hospitalar"
        description="Atendimentos mensais, procedimentos e CID no período selecionado. Blocos sem fonte pública verificável ficam explicitamente indisponíveis."
        badgeValue={<SaudeSyncBadge value={hospitalQuery.data?.last_synced_at} />}
        actions={
          <div className="flex flex-col gap-3">
            <SaudePeriodFilter
              year={year}
              startDate={startDate}
              endDate={endDate}
              onYearChange={handleYearChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={setEndDate}
              minStartDate={MIN_START_DATE}
            />
            <input
              type="number"
              min="1"
              value={estabelecimentoId}
              onChange={(event) => setEstabelecimentoId(event.target.value)}
              placeholder="Filtrar por estabelecimento ID"
              className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
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
        <SaudePanel title="Mapa de calor por hora e dia" description="Contrato visual do mapa de calor hospitalar. A grade entra em estado indisponível até existir fonte pública verificável.">
          <HospitalHeatmapPlaceholder />
        </SaudePanel>

        <SaudePanel title="Atendimentos mensais" description="Atendimentos hospitalares agregados pelos meses cobertos pelo período selecionado.">
          <MonthlySeriesOrUnavailable
            items={hospitalQuery.data?.attendances_by_month ?? []}
            emptyTitle="Atendimentos mensais indisponíveis"
            emptyDescription="A fonte externa não publicou atendimentos hospitalares para este recorte."
          />
        </SaudePanel>
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

        <SaudePanel title="Atendimentos por CID" description="Distribuição dos atendimentos hospitalares por CID quando a origem publica o recorte.">
          <RankingOrUnavailable
            items={hospitalQuery.data?.internacoes_by_cid ?? []}
            emptyTitle="CID indisponível"
            emptyDescription="A fonte externa não retornou atendimentos por CID para o período selecionado."
          />
        </SaudePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SaudePanel title="Procedimentos realizados por especialidade" description="Quantidade de procedimentos realizados no período.">
          {hasChartData(hospitalQuery.data?.procedures) ? (
            <div className="space-y-4">
              <SaudeMetricCard
                label="Total de procedimentos"
                value={formatNumber(hospitalQuery.data?.total_procedures ?? 0, { decimals: 0 })}
                supportingText={`Consolidado entre ${startDate} e ${endDate}.`}
                tone="success"
                icon="medical_services"
              />
              <RankingOrUnavailable
                items={hospitalQuery.data?.procedures ?? []}
                emptyTitle="Procedimentos indisponíveis"
                emptyDescription="A fonte externa não retornou procedimentos para o período selecionado."
              />
            </div>
          ) : (
            <SaudeUnavailablePanel
              title="Procedimentos indisponíveis"
              description="A origem pública não publicou esse recorte hospitalar no momento."
            />
          )}
        </SaudePanel>

        <SaudePanel
          title="Blocos indisponíveis na fonte"
          description="Esses recortes permanecem mapeados, mas sem uma fonte pública verificável neste momento."
        >
          <div className="flex flex-wrap gap-3">
            {unavailableResources.map((resource) => (
              <span
                key={resource}
                className="rounded-full border border-outline/10 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant"
              >
                {unavailableLabels[resource] ?? resource}
              </span>
            ))}
          </div>
        </SaudePanel>
      </section>
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

function HospitalHeatmapPlaceholder() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
        <div />
        {HEATMAP_HOURS.map((hour) => (
          <div key={hour} className="text-center">
            {hour}
          </div>
        ))}
        <div className="text-center">Total</div>
      </div>

      <div className="space-y-1">
        {HEATMAP_DAYS.map((day, rowIndex) => (
          <div key={`${day}-${rowIndex}`} className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1">
            <div className="flex items-center justify-center text-sm font-semibold text-on-surface-variant">{day}</div>
            {HEATMAP_HOURS.map((hour, columnIndex) => (
              <div
                key={`${day}-${hour}`}
                className="h-8 rounded-md border border-outline/10"
                style={{
                  background:
                    columnIndex % 4 === 0
                      ? 'rgba(245, 158, 11, 0.38)'
                      : columnIndex % 3 === 0
                        ? 'rgba(249, 221, 95, 0.68)'
                        : 'rgba(255, 244, 170, 0.82)',
                }}
              />
            ))}
            <div className="flex items-center justify-center rounded-md bg-surface-container-lowest text-sm font-semibold text-on-surface-variant">
              --
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))_64px] gap-1">
        <div />
        {HEATMAP_HOURS.map((hour) => (
          <div
            key={`total-${hour}`}
            className="flex h-8 items-center justify-center rounded-md bg-surface-container-lowest text-sm font-semibold text-on-surface-variant"
          >
            --
          </div>
        ))}
        <div className="flex items-center justify-center rounded-md bg-surface-container-high text-sm font-semibold text-on-surface-variant">
          --
        </div>
      </div>

      <SaudeUnavailablePanel
        title="Mapa de calor indisponível"
        description="A grade já segue o contrato visual final, mas a origem pública ainda não expõe os dados horários por dia da semana."
      />
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
