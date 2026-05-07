import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PrefeituraOfficialCard } from '@/components/prefeitura/PrefeituraOfficialCard';

describe('PrefeituraOfficialCard', () => {
  it('exibe fallback quando o nome do gestor ainda não foi publicado', () => {
    render(
      <PrefeituraOfficialCard
        official={{
          role: 'Prefeito(a)',
          name: null,
          photo_url: null,
          bio: null,
        }}
      />
    );

    expect(screen.getByText('Aguardando atualização')).toBeInTheDocument();
    expect(screen.getByText('Prefeito(a)')).toBeInTheDocument();
  });
});
