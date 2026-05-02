export interface DiarioEdicao {
  numero: string;
  data: string;
  link_download: string;
  tamanho: string | null;
  suplementar: boolean;
}

export interface DiarioResponse {
  data_consulta: string;
  tem_edicao: boolean;
  edicoes: DiarioEdicao[];
  mensagem: string | null;
}

export interface DiarioBuscaItem {
  id: string;
  titulo: string;
  data_publicacao: string;
  numero_materia: string;
  numero_lei: string;
  ano_lei: string;
  link_download: string;
}

export interface DiarioBuscaResponse {
  items: DiarioBuscaItem[];
  total: number;
  page: number;
  size: number;
}

export interface DiarioImportRequest {
  diario_id: string;
  titulo: string;
  data_publicacao: string;
  numero_materia: string;
  link_download: string;
  numero_lei: string;
  ano_lei: string;
  tipo: string;
}
