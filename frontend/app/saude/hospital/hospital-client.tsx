'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import HospitalHeatmapPanel from '@/app/saude/hospital/HospitalHeatmapPanel';
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
        description="Mapa de calor, não munícipes, produção médica e demais recortes hospitalares consolidados para o período selecionado."
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
              placeholder="Filtrar por estabelecimento ID (padrão 1)"
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
        <SaudePanel title="Mapa de calor por hora e dia" description="Distribuição dos atendimentos por hora e dia da semana para o hospital selecionado.">
          <HospitalHeatmapPanel heatmap={hospitalQuery.data?.heatmap ?? null} />
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
        <SaudePanel title="Atendimentos de não munícipes" description="Atendimentos hospitalares prestados a pacientes de outros municípios.">
          <MonthlySeriesOrUnavailable
            items={hospitalQuery.data?.non_resident_attendances ?? []}
            emptyTitle="Não munícipes indisponíveis"
            emptyDescription="A fonte externa não retornou esse recorte para o período selecionado."
            stroke="#ea782c"
          />
        </SaudePanel>

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
        <SaudePanel title="Atendimentos por médico" description="Quantidade de atendimentos agrupada pelo profissional responsável no período.">
          <RankingOrUnavailable
            items={hospitalQuery.data?.attendances_by_doctor ?? []}
            emptyTitle="Atendimentos por médico indisponíveis"
            emptyDescription="A fonte externa não retornou produção por médico para o filtro atual."
          />
        </SaudePanel>

        <SaudePanel title="Atendimentos por CBO da especialidade" description="Produção agrupada pelo CBO da especialidade no período selecionado.">
          <RankingOrUnavailable
            items={hospitalQuery.data?.attendances_by_specialty_cbo ?? []}
            emptyTitle="CBO da especialidade indisponível"
            emptyDescription="A fonte externa não retornou a distribuição por CBO para o filtro atual."
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
