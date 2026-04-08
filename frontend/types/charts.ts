/**
 * Tipos para gráficos e visualizações
 * Dashboard Financeiro - Bandeirantes MS
 */

// ============================================
// Recharts Custom Types
// ============================================

// Props base para gráficos
export interface ChartBaseProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  animate?: boolean;
  loading?: boolean;
}

// Configuração de tooltip
export interface TooltipConfig {
  show?: boolean;
  formatter?: (value: number, name: string, props: Record<string, unknown>) => string;
  labelFormatter?: (label: string) => string;
  contentStyle?: Record<string, string>;
}

// Configuração de legenda
export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  formatter?: (value: string) => string;
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// ============================================
// Time Series Chart Types
// ============================================

// Dados para gráfico temporal
export interface TimeSeriesDatum {
  date: Date;
  value: number;
  label?: string;
  secondaryValue?: number; // Para gráficos compostos
}

// Props para gráfico de linha temporal
export interface LineChartProps extends ChartBaseProps {
  data: TimeSeriesDatum[];
  xAxisKey?: string;
  yAxisKey?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  strokeDasharray?: string;
  showDots?: boolean;
  showArea?: boolean;
  gradient?: {
    from: string;
    to: string;
  };
}

// Props para gráfico de área temporal
export interface AreaChartProps extends ChartBaseProps {
  data: TimeSeriesDatum[];
  showDots?: boolean;
  showForecast?: boolean;
  confidenceBand?: {
    lower: TimeSeriesDatum[];
    upper: TimeSeriesDatum[];
  };
  fillOpacity?: number;
  gradient?: {
    from: string;
    to: string;
  };
}

// ============================================
// KPI Card Types
// ============================================

// Dados para KPI Card
export interface KPICardData {
  titulo: string;
  valor: number;
  tipo: 'currency' | 'percent' | 'number';
  prefixo?: string;
  sufixo?: string;
  variacao?: number;
  variacao_tipo?: 'positiva' | 'negativa' | 'neutra';
  periodo_comparacao?: string;
  sparkline_data?: number[];
  tendencia?: 'alta' | 'baixa' | 'estavel';
  alerta?: {
    tipo: 'info' | 'warning' | 'danger';
    mensagem: string;
  };
}

// Props para KPI Card
export interface KPICardProps extends ChartBaseProps {
  data: KPICardData;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  showTrend?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

// ============================================
// Comparison Chart Types
// ============================================

// Dados para gráfico comparativo
export interface ComparisonData {
  label: string;
  valor_atual: number;
  valor_anterior: number;
  categoria?: string;
}

// Props para gráfico de comparação
export interface ComparisonChartProps extends ChartBaseProps {
  data: ComparisonData[];
  mostrar_variacao?: boolean;
  mostrar_percentual?: boolean;
  colors?: {
    atual: string;
    anterior: string;
  };
}

// ============================================
// Distribution Chart Types
// ============================================

// Dados para gráfico de distribuição (pie/donut)
export interface DistributionData {
  id: string;
  nome: string;
  valor: number;
  cor?: string;
  percentual?: number;
  children?: DistributionData[];
}

// Props para gráfico de distribuição
export interface DistributionChartProps extends ChartBaseProps {
  data: DistributionData[];
  tipo?: 'pie' | 'donut' | 'treemap';
  showLabels?: boolean;
  showPercent?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
}

// ============================================
// Sankey Chart Types
// ============================================

// Node do Sankey
export interface SankeyNodeData {
  id: string;
  nome: string;
  categoria: 'source' | 'target' | 'intermediate';
  valor: number;
  cor?: string;
  x?: number;
  y?: number;
  height?: number;
}

// Link do Sankey
export interface SankeyLinkData {
  source: string;
  target: string;
  valor: number;
  percentual?: number;
  cor?: string;
}

// Props para Sankey
export interface SankeyChartProps extends ChartBaseProps {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
  nodeWidth?: number;
  nodePadding?: number;
  linkOpacity?: number;
  showValues?: boolean;
  onNodeClick?: (node: SankeyNodeData) => void;
  onLinkClick?: (link: SankeyLinkData) => void;
}

// ============================================
// Heatmap Chart Types
// ============================================

// Dados para heatmap (sazonalidade)
export interface HeatmapDataCell {
  mes: number; // 0-11
  ano: number;
  valor: number;
  intensidade: number; // 0-100
  label?: string;
  tooltip?: string;
}

// Props para heatmap
export interface HeatmapChartProps extends ChartBaseProps {
  data: HeatmapDataCell[];
  anos?: number[];
  showLabels?: boolean;
  showTooltip?: boolean;
  colorScale?: {
    min: string;
    max: string;
    mid?: string;
  };
  meses_labels?: string[];
}

// ============================================
// Gauge/Radial Chart Types
// ============================================

// Dados para gauge/radial
export interface GaugeData {
  valor: number;
  total: number;
  label?: string;
  unidade?: string;
  threshold?: {
    warning: number;
    danger: number;
  };
}

// Props para gauge
export interface GaugeChartProps extends ChartBaseProps {
  data: GaugeData;
  colors?: {
    good: string;
    warning: string;
    danger: string;
  };
  showValue?: boolean;
  showPercent?: boolean;
  thickness?: number;
}

// ============================================
// Treemap Chart Types
// ============================================

// Dados para treemap (hierarquia)
export interface TreemapNodeData {
  id: string;
  nome: string;
  valor: number;
  caminho?: string[];
  filhos?: TreemapNodeData[];
  cor?: string;
  profundidade?: number;
}

// Props para treemap
export interface TreemapChartProps extends ChartBaseProps {
  data: TreemapNodeData;
  showLabels?: boolean;
  showValues?: boolean;
  showPercent?: boolean;
  padding?: number;
  animationDuration?: number;
}

// ============================================
// Export Types
// ============================================

export type ChartType = 
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'sankey'
  | 'heatmap'
  | 'gauge'
  | 'treemap'
  | 'sparkline';

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'csv' | 'json';

export interface ChartExportOptions {
  type: ChartType;
  format: ExportFormat;
  filename?: string;
  width?: number;
  height?: number;
  includeTitle?: boolean;
  includeLegend?: boolean;
}