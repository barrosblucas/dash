'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeMetricCard, SaudePageHeader, SaudePanel } from '@/components/saude/SaudePageSection';
import SaudeStateBlock from '@/components/saude/SaudeStateBlock';
import SaudeSyncBadge from '@/components/saude/SaudeSyncBadge';
import { formatTrendSummary, getTrendAccent, getTrendIcon } from '@/lib/saude-utils';
import { formatNumber } from '@/lib/utils';
import { saudeService } from '@/services/saude-service';

const chartColors = ['#0f4c81', '#22c55e', '#f59e0b', '#06b6d4'];

export default function PerfilEpidemiologicoClient() {
  const epidemiologicalQuery = useQuery({
    queryKey: ['saude', 'epidemiological-profile'],
    queryFn: saudeService.getEpidemiologicalProfile,
  });

  if (epidemiologicalQuery.isLoading) {
    return <SaudeStateBlock type="loading" title="Carregando perfil epidemiológico..." />;
  }

  if (epidemiologicalQuery.error instanceof Error) {
    return (
      <SaudeStateBlock
        type="error"
        title="Falha ao carregar perfil epidemiológico"
        description={epidemiologicalQuery.error.message}
      />
    );
  }

  const quantitativeMetrics = epidemiologicalQuery.data?.quantitativos ?? [];
  const sexDistribution = epidemiologicalQuery.data?.por_sexo ?? [];

  return (
    <div className="space-y-6">
      <SaudePageHeader
        eyebrow="US-05"
        title="Perfil epidemiológico do atendimento municipal"
        description="Contadores assistenciais com leitura imediata do momento da rede e distribuição real de atendimentos por sexo."
        badgeValue={<SaudeSyncBadge value={epidemiologicalQuery.data?.last_synced_at} />}
      />

      <SaudeFeatureNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quantitativeMetrics.map((item) => (
          <SaudeMetricCard
            key={item.label}
            label={item.label}
            value={formatNumber(item.value, { decimals: 0 })}
            supportingText={formatTrendSummary(item.trend)}
            icon={getTrendIcon(item.trend?.direction)}
            tone={item.trend?.direction === 'down' ? 'warning' : item.trend?.direction === 'up' ? 'success' : 'info'}
          />
        ))}
      </section>

      <SaudePanel
        title="Atendimentos por sexo"
        description="Leitura direta da distribuição de atendimento registrada na fonte externa."
      >
        {sexDistribution.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sexDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {sexDistribution.map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <SaudeStateBlock
            type="empty"
            title="Sem distribuição por sexo disponível"
            description="A fonte externa ainda não retornou valores para este recorte."
          />
        )}
      </SaudePanel>

      <SaudePanel
        title="Leitura de tendência"
        description="Quando a fonte externa enviar tendência histórica, ela aparece nos cards acima. Sem histórico, o painel deixa isso explícito."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {quantitativeMetrics.slice(0, 3).map((item) => (
            <div key={`${item.label}-trend`} className="rounded-[24px] border border-outline/10 bg-surface-container-lowest p-5">
              <div className={`inline-flex items-center gap-2 text-sm font-semibold ${getTrendAccent(item.trend?.direction)}`}>
                <span className="material-symbols-outlined text-base">{getTrendIcon(item.trend?.direction)}</span>
                {item.label}
              </div>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{formatTrendSummary(item.trend)}</p>
            </div>
          ))}
        </div>
      </SaudePanel>
    </div>
  );
}
