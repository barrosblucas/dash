export type ObraStatus = 'em_andamento' | 'paralisada' | 'concluida';

export interface ObraMediaAsset {
  id?: number;
  titulo: string | null;
  media_kind: string;
  source_type: string;
  url: string | null;
  original_name?: string | null;
  content_type?: string | null;
  file_size?: number | null;
}

export interface ObraLocation {
  id?: number;
  sequencia: number;
  logradouro: string;
  bairro: string;
  cep: string;
  numero: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ObraFundingSource {
  id?: number;
  sequencia: number;
  nome: string;
  valor: number | null;
}

export interface ObraMedicao {
  id?: number;
  sequencia: number;
  mes_referencia: number;
  ano_referencia: number;
  valor_medicao: number;
  observacao: string | null;
  media_assets: ObraMediaAsset[];
}

export interface ObraRecord {
  hash: string;
  titulo: string;
  descricao: string;
  status: ObraStatus;
  secretaria: string;
  orgao: string;
  contrato: string;
  tipo_obra: string;
  modalidade: string;
  fonte_recurso: string;
  data_inicio: string | null;
  previsao_termino: string | null;
  data_termino: string | null;
  logradouro: string;
  bairro: string;
  cep: string;
  numero: string;
  latitude: number | null;
  longitude: number | null;
  valor_orcamento: number | null;
  valor_original: number | null;
  valor_aditivo: number | null;
  valor_homologado: number | null;
  valor_contrapartida: number | null;
  valor_convenio: number | null;
  valor_economizado: number | null;
  progresso_fisico: number | null;
  progresso_financeiro: number | null;
  locations: ObraLocation[];
  funding_sources: ObraFundingSource[];
  media_assets: ObraMediaAsset[];
  medicoes: ObraMedicao[];
  valor_medido_total: number;
  created_at: string;
  updated_at: string;
}

export interface ObrasListResponse {
  obras: ObraRecord[];
  total: number;
}

export interface ObraUpsertPayload {
  titulo: string;
  descricao: string;
  status: ObraStatus;
  secretaria: string;
  orgao: string;
  contrato: string;
  tipo_obra: string;
  modalidade: string;
  fonte_recurso: string;
  data_inicio: string;
  previsao_termino: string | null;
  data_termino: string | null;
  logradouro: string;
  bairro: string;
  cep: string;
  numero: string;
  latitude: number | null;
  longitude: number | null;
  valor_orcamento: number | null;
  valor_original: number | null;
  valor_aditivo: number | null;
  valor_homologado: number | null;
  valor_contrapartida: number | null;
  valor_convenio: number | null;
  progresso_fisico: number | null;
  progresso_financeiro: number | null;
  locations: ObraLocation[];
  funding_sources: ObraFundingSource[];
  media_assets: ObraMediaAsset[];
  medicoes: ObraMedicao[];
}

export interface ObraMediaLinkPayload {
  medicao_id?: number | null;
  titulo?: string | null;
  media_kind?: string;
  url: string;
}
