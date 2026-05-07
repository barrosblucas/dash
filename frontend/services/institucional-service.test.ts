import { describe, expect, it, vi, beforeEach } from 'vitest';

import { institucionalService } from '@/services/institucional-service';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('institucional-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta dados da prefeitura', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      city_hall_name: 'Prefeitura Municipal de Bandeirantes',
      description: 'Descrição teste',
      image_url: null,
      contact: {
        address: 'Rua Teste, 123',
        phone: '6733330000',
        email: 'prefeitura@teste.ms.gov.br',
        office_hours: '08:00 às 17:00',
      },
      social_links: [{ label: 'Facebook', url: 'https://facebook.com/teste' }],
      updated_at: '2026-05-06T10:00:00',
    });

    const response = await institucionalService.getCityHall();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/institucional/prefeitura');
    expect(response.city_hall_name).toBe('Prefeitura Municipal de Bandeirantes');
    expect(response.contact.phone).toBe('6733330000');
  });

  it('consulta gestão municipal', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      mayor: { role: 'Prefeito', name: 'João Silva', photo_url: null, bio: 'Bio teste' },
      vice_mayor: { role: 'Vice-Prefeito', name: 'Maria Souza', photo_url: null, bio: null },
      cabinet_chief: { role: 'Chefe de Gabinete', name: 'Carlos Lima', photo_url: null, bio: null },
      cabinet_description: 'Descrição do gabinete',
      updated_at: '2026-05-06T10:00:00',
    });

    const response = await institucionalService.getManagement();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/institucional/gestao');
    expect(response.mayor.name).toBe('João Silva');
    expect(response.cabinet_chief.role).toBe('Chefe de Gabinete');
  });

  it('lista secretarias e autarquias', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [
        { id: 1, slug: 'saude', name: 'Saúde', kind: 'secretaria', leader_title: 'Secretário', secretary_name: 'Dr. Teste', secretary_photo_url: null, description: null, mission: null, vision: null, values: null, phone: null, email: null, address: null, office_hours: null, image_url: null, updated_at: '' },
        { id: 2, slug: 'saae', name: 'SAAE', kind: 'autarquia', leader_title: 'Diretor', secretary_name: 'Eng. Teste', secretary_photo_url: null, description: null, mission: null, vision: null, values: null, phone: null, email: null, address: null, office_hours: null, image_url: null, updated_at: '' },
      ],
      total: 2,
    });

    const response = await institucionalService.listDepartments();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/institucional/secretarias');
    expect(response.items).toHaveLength(2);
    expect(response.items[0].kind).toBe('secretaria');
    expect(response.items[1].kind).toBe('autarquia');
  });

  it('consulta detalhe de secretaria por slug', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      id: 1,
      slug: 'saude',
      name: 'Saúde',
      kind: 'secretaria',
      leader_title: 'Secretário',
      secretary_name: 'Dr. Teste',
      secretary_photo_url: null,
      description: 'Descrição saúde',
      mission: 'Missão saúde',
      vision: 'Visão saúde',
      values: 'Valores saúde',
      phone: '6733330000',
      email: 'saude@teste.ms.gov.br',
      address: 'Rua Saúde, 100',
      office_hours: '08:00 às 17:00',
      image_url: null,
      updated_at: '',
    });

    const response = await institucionalService.getDepartmentBySlug('saude');

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/institucional/secretarias/saude');
    expect(response.name).toBe('Saúde');
    expect(response.mission).toBe('Missão saúde');
  });

  it('lista repartições', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      items: [
        { id: 1, department_id: 1, department_name: 'Saúde', department_slug: 'saude', kind: 'setor', name: 'Setor de Vacinas', description: null, phone: '6733330001', email: null, address: 'Rua Vacinas, 50', office_hours: '08:00 às 12:00', latitude: null, longitude: null, updated_at: '' },
      ],
      total: 1,
    });

    const response = await institucionalService.listOffices();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/institucional/reparticoes');
    expect(response.items).toHaveLength(1);
    expect(response.items[0].name).toBe('Setor de Vacinas');
  });
});
