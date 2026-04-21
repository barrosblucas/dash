export type ProjectionMode = 'annual' | 'monthly';

export interface ChartRow {
  label: string;
  receitas: number | null;
  despesas: number | null;
  receitasPrevistas: number | null;
  despesasPrevistas: number | null;
  tipo: 'histórico' | 'projeção';
}

export interface KPIAnual {
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export interface KPIMensal {
  mes: number;
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  kpis_mensais: KPIMensal[] | null;
  kpis_anuais: KPIAnual[] | null;
}

export interface ForecastPoint {
  data: string;
  valor_previsto: number;
}

export interface ForecastResponse {
  tipo: string;
  horizonte_meses: number;
  nivel_confianca: number;
  previsoes: ForecastPoint[];
}

export interface ForecastSectionProps {
  height?: number;
  yearsToProject?: number;
  projectionMode?: ProjectionMode;
  className?: string;
}
