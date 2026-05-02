export interface LegislacaoBuscaItem {
  id: string;
  titulo: string;
  data_publicacao: string;
  numero_materia: string;
  numero_lei: string;
  ano_lei: string;
  link_legislacao: string;      // /baixar-materia/{id}/{hash}
  link_diario_oficial: string;  // DigitalOcean Spaces URL
  anexo_habilitado: boolean;
}

export interface LegislacaoBuscaResponse {
  items: LegislacaoBuscaItem[];
  total: number;
  page: number;
  size: number;
}

export interface LegislacaoImportRequest {
  legislacao_id: string;
  titulo: string;
  data_publicacao: string;
  numero_materia: string;
  link_legislacao: string;
  link_diario_oficial: string;
  numero_lei: string;
  ano_lei: string;
  tipo: string;
}
