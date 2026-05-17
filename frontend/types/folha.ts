/**
 * Tipos para Folha de Pagamento
 * Portal da Transparencia - Bandeirantes MS
 */

export interface FolhaOfficeItem {
  office_id: number;
  office_description: string;
  department_id: number | null;
  department_description: string | null;
  ano: number;
  mes: number;
}

export interface FolhaOfficeListResponse {
  items: FolhaOfficeItem[];
}

export interface FolhaEmployeeItem {
  ano: number;
  mes: number;
  office_id: number;
  office_description: string;
  department_id: number | null;
  department_description: string | null;
  contract: string;
  name: string;
  cpf: string;
  role: string;
  class_and_level: string;
  state: string;
  admission_date: string;
  end_date: string | null;
  base_salary: number;
  tenth_salary: number;
  vacation: number;
  gratification: number;
  others_earnings: number;
  discounts: number;
  gross_salary: number;
  net_salary: number;
  role_type_id: number | null;
}

export interface FolhaResumoMensal {
  ano: number;
  mes: number;
  quantidade_servidores: number;
  total_bruto: number;
  total_liquido: number;
  total_descontos: number;
}

export interface FolhaEmployeeListResponse {
  items: FolhaEmployeeItem[];
  quantidade: number;
  resumo: FolhaResumoMensal;
}

export interface FolhaOfficeAggregated {
  office_id: number;
  office_description: string;
  department_id: number | null;
  department_description: string | null;
  quantidade_servidores: number;
  total_bruto: number;
  total_liquido: number;
  total_descontos: number;
}
