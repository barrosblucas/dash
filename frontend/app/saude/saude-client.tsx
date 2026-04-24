'use client';

import SaudeFeatureNav from '@/components/saude/SaudeFeatureNav';
import { SaudeFeatureCard, SaudePageHeader } from '@/components/saude/SaudePageSection';
import { saudeFeatureCards } from '@/lib/saude-utils';

export default function SaudeClient() {
  return (
    <div className="space-y-8">
      <SaudePageHeader
        eyebrow="Saúde Transparente"
        title="Rede pública, serviços e produção assistencial em um só lugar"
        description="A feature saúde agora separa farmácia do estoque, amplia vacinação, visitas domiciliares, atenção primária, saúde bucal e hospital, e mantém navegação integrada com os painéis já publicados."
      />

      <SaudeFeatureNav />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {saudeFeatureCards.map((card) => (
          <SaudeFeatureCard key={card.href} {...card} />
        ))}
      </section>
    </div>
  );
}
