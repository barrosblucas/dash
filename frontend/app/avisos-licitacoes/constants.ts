/**
 * Constantes para Avisos de Licitações
 */

export type ViewMode = 'month' | 'week' | 'list';
export type FonteFilter = 'todas' | 'pregao' | 'dispensa' | 'concorrencia';
export type StatusFilter = 'todas' | 'aguardando' | 'encerrado' | 'suspenso';

export const COMPRASBR_URL =
  'https://comprasbr.com.br/pregao-eletronico/?estado=MS&idMunicipio=1275';
export const QUALITY_URL =
  'https://avisolicitacao.qualitysistemas.com.br/prefeitura_municipal_de_bandeirantes';

export const FONTES: { key: FonteFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pregao', label: 'Pregão Eletrônico' },
  { key: 'dispensa', label: 'Dispensa' },
  { key: 'concorrencia', label: 'Concorrência' },
];

export const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'encerrado', label: 'Encerrado' },
  { key: 'suspenso', label: 'Suspenso' },
];

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
