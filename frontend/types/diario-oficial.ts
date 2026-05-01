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
