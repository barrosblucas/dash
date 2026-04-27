import { screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import HospitalClient from '@/app/saude/hospital/hospital-client';
import { saudeService } from '@/services/saude-service';
import { renderWithQuery } from '@/test/helpers';

vi.mock('next/navigation');
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/services/saude-service', () => ({
  saudeService: {
    getHospitalDashboard: vi.fn(),
  },
}));

vi.mock('recharts', () => {
  const Mock = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    BarChart: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
    XAxis: Mock,
    YAxis: Mock,
    Line: Mock,
    Bar: Mock,
  };
});

describe('HospitalClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/saude/hospital');
  });

  it('expõe estados explícitos quando blocos hospitalares estão indisponíveis', async () => {
    vi.mocked(saudeService.getHospitalDashboard).mockResolvedValue({
      censo: null,
      heatmap: null,
      attendances_by_month: [],
      non_resident_attendances: [],
      attendances_by_doctor: [],
      attendances_by_specialty_cbo: [],
      procedures: [],
      total_procedures: 0,
      internacoes_by_month: [],
      internacoes_by_cid: [],
      average_stay_by_month: [],
      unavailable_resources: ['internacoes_por_mes'],
      last_synced_at: null,
    });

    renderWithQuery(<HospitalClient />);

    expect((await screen.findAllByText(/censo indisponível/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/mapa de calor indisponível/i)).toBeInTheDocument();
    expect(screen.getByText(/não munícipes indisponíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/atendimentos por médico indisponíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/procedimentos indisponíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/internações mensais/i)).toBeInTheDocument();
  });
});
