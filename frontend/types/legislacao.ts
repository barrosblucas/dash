/**
 * Tipos da feature Legislação
 * Espelha os schemas Pydantic do backend
 */

export type TipoLegislacao =
  | 'LEI'
  | 'LEI_COMPLEMENTAR'
  | 'DECRETO'
  | 'DECRETO_LEI'
  | 'PORTARIA'
  | 'RESOLUCAO'
  | 'EMENDA';

export type StatusLegislacao = 'ATIVA' | 'REVOGADA' | 'ALTERADA';

export interface LegislacaoItem {
  id: string;
  tipo: TipoLegislacao;
  numero: string;
  ano: number;
  ementa: string;
  data_publicacao: string;
  data_promulgacao: string | null;
  status: StatusLegislacao;
  autor: string | null;
}

export interface LegislacaoDetalhe {
  id: string;
  tipo: TipoLegislacao;
  numero: string;
  ano: number;
  ementa: string;
  texto_integral: string;
  data_publicacao: string;
  data_promulgacao: string | null;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  status: StatusLegislacao;
  autor: string | null;
  sancionado_por: string | null;
  origem: string | null;
  legislacao_vinculada: string[] | null;
  url_arquivo: string | null;
}

export interface LegislacaoListResponse {
  items: LegislacaoItem[];
  total: number;
  page: number;
  size: number;
}

export interface LegislacaoFilters {
  page?: number;
  size?: number;
  tipo?: TipoLegislacao | '';
  ano?: number | '';
  status?: StatusLegislacao | '';
  busca?: string;
}
