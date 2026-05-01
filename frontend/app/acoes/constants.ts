export interface DashboardAction {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryIcon: string;
  investment: string;
  investmentRaw: number;
  impactLabel: string;
  impactNumber: number;
  impactSuffix: string;
  image: string;
  month: string;
  year: string;
  status: 'concluída' | 'em andamento';
  color: string;
  progress: number;
}

export const actions: DashboardAction[] = [
  { id: 1, title: 'Pavimentação da Av. Central', description: 'Recapeamento integral de 3,2 km com nova sinalização, acessibilidade universal e galerias pluviais. Beneficiou 12 mil moradores da região central.',
    category: 'Infraestrutura', categoryIcon: 'road', investment: 'R$ 4.200.000', investmentRaw: 4200000, impactLabel: 'Beneficiados', impactNumber: 12, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80', month: 'Janeiro', year: '2024', status: 'concluída', color: '#3b82f6', progress: 100 },
  { id: 2, title: 'UBS Jardim América', description: 'Unidade com 420m², 4 consultórios, farmácia e acolhimento. Atendimento ampliado para 8 mil pacientes da região sul.',
    category: 'Saúde', categoryIcon: 'local_hospital', investment: 'R$ 2.800.000', investmentRaw: 2800000, impactLabel: 'Pacientes', impactNumber: 8, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', month: 'Março', year: '2024', status: 'concluída', color: '#10b981', progress: 100 },
  { id: 3, title: 'Praça da Juventude', description: 'Academia ao ar livre, playground inclusivo, pista de skate, quadra poliesportiva e Wi-Fi gratuito. Mais de 5 mil visitantes mensais.',
    category: 'Lazer', categoryIcon: 'sports_soccer', investment: 'R$ 1.500.000', investmentRaw: 1500000, impactLabel: 'Visitantes/mês', impactNumber: 5, impactSuffix: ' mil',
    image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80', month: 'Maio', year: '2024', status: 'concluída', color: '#ec4899', progress: 100 },
  { id: 4, title: 'Iluminação LED', description: 'Substituição de 2.400 pontos de iluminação com redução de 60% no consumo energético. Melhoria da segurança em 18 bairros.',
    category: 'Urbanismo', categoryIcon: 'lightbulb', investment: 'R$ 3.100.000', investmentRaw: 3100000, impactLabel: 'Economia energ.', impactNumber: 60, impactSuffix: '%',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80', month: 'Julho', year: '2024', status: 'concluída', color: '#f59e0b', progress: 100 },
  { id: 5, title: 'Escola Municipal Prof. João Silva', description: 'Construção de 8 salas de aula, laboratório de informática, biblioteca e quadra coberta. Capacidade para 480 alunos em período integral.',
    category: 'Educação', categoryIcon: 'school', investment: 'R$ 6.500.000', investmentRaw: 6500000, impactLabel: 'Alunos', impactNumber: 480, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', month: 'Setembro', year: '2024', status: 'em andamento', color: '#8b5cf6', progress: 72 },
  { id: 6, title: 'Rede de Esgoto — Bairro Progresso', description: 'Implantação de 4,8 km de rede coletora, ligação domiciliar e estação elevatória. Universalização do saneamento para 1.800 famílias.',
    category: 'Saneamento', categoryIcon: 'water_drop', investment: 'R$ 5.300.000', investmentRaw: 5300000, impactLabel: 'Famílias', impactNumber: 1800, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', month: 'Janeiro', year: '2025', status: 'em andamento', color: '#06b6d4', progress: 55 },
  { id: 7, title: 'CRAS — Centro de Referência', description: 'Centro de Assistência Social com brinquedoteca, salas de capacitação e cursos profissionalizantes. 3.500 atendimentos por ano.',
    category: 'Assistência', categoryIcon: 'volunteer_activism', investment: 'R$ 1.900.000', investmentRaw: 1900000, impactLabel: 'Atendidos/ano', impactNumber: 3500, impactSuffix: '',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80', month: 'Fevereiro', year: '2025', status: 'concluída', color: '#f43f5e', progress: 100 },
];

export const categories = ['Todas', 'Infraestrutura', 'Saúde', 'Lazer', 'Urbanismo', 'Educação', 'Saneamento', 'Assistência'];
