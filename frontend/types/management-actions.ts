export interface ManagementAction {
  id: number;
  title: string;
  description: string | null;
  category: string;
  category_icon: string;
  investment: string;
  investment_raw: number;
  impact_label: string;
  impact_number: number;
  impact_suffix: string;
  image: string | null;
  month: string;
  year: string;
  status: 'concluída' | 'em andamento';
  color: string;
  progress: number;
}

export interface ManagementActionListResponse {
  items: ManagementAction[];
  total: number;
}
