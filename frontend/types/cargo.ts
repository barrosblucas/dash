/**
 * Tipos para Cargos e Salários
 * Portal da Transparência - Bandeirantes MS
 */

export interface CargoItem {
  cargo: string;
  carga_horaria: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  salario_base: number;
  efetivo: number;
  comissionado: number;
  contratado: number;
  eletivo: number;
  convocados: number;
  categoria: string;
  ano: number;
}

export interface CargoResumoCategoria {
  categoria: string;
  quantidade_cargos: number;
  total_vagas: number;
  total_ocupados: number;
  total_salario_base: number;
}

export interface CargoResumoAnual {
  ano: number;
  quantidade_cargos: number;
  total_vagas: number;
  total_ocupados: number;
  total_salario_base: number;
  categorias: CargoResumoCategoria[];
}

export interface CargoListResponse {
  items: CargoItem[];
  quantidade: number;
  resumo: CargoResumoAnual;
}
