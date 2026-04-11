/**
 * Serviço de API client
 * Dashboard Financeiro - Bandeirantes MS
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '@/lib/constants';

// Tipos de erro da API
export interface ApiErrorResponse {
  error: string;
  detail?: string;
  code?: string;
}

// Configuração do cliente Axios
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_ENDPOINTS.base;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logs de Requisição
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response) {
          // Erro de resposta do servidor
          const status = error.response.status;
          const message = error.response.data?.error || error.message;
          const detail = error.response.data?.detail;
          
          console.error(`[API] Error ${status}:`, message, detail);
          
          if (status === 404) {
            throw new Error(`Recurso não encontrado: ${message}`);
          }
          
          if (status === 400) {
            throw new Error(`Requisição inválida: ${detail || message}`);
          }
          
          if (status >= 500) {
            throw new Error(`Erro interno do servidor: ${message}`);
          }
        } else if (error.request) {
          // Não houve resposta do servidor
          console.error('[API] No response received:', error.message);
          throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
          // Erro na configuração da requisição
          console.error('[API] Request setup error:', error.message);
          throw new Error(`Erro na requisição: ${error.message}`);
        }
        
        throw error;
      }
    );
  }

  // Métodos HTTP
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string; database: string }> {
    return this.get('/health');
  }
}

// Instância única do cliente
export const apiClient = new ApiClient();

// Tipos de retorno das APIs
interface ReceitaListResponse {
  receitas: Array<{
    id: number | null; ano: number; mes: number; categoria: string;
    subcategoria: string | null; tipo: 'CORRENTE' | 'CAPITAL';
    valor_previsto: number; valor_arrecadado: number; valor_anulado: number; fonte: string;
  }>;
  total: number; page: number; page_size: number; has_next: boolean;
}

interface DespesaListResponse {
  despesas: Array<{
    id: number | null; ano: number; mes: number; categoria: string | null;
    subcategoria: string | null; tipo: 'CORRENTE' | 'CAPITAL' | 'CONTINGENCIA';
    valor_empenhado: number; valor_liquidado: number; valor_pago: number; fonte: string;
  }>;
  total: number; page: number; page_size: number; has_next: boolean;
}

interface ReceitaResponse {
  id: number | null; ano: number; mes: number; categoria: string;
  subcategoria: string | null; tipo: 'CORRENTE' | 'CAPITAL';
  valor_previsto: number; valor_arrecadado: number; valor_anulado: number; fonte: string;
}

interface DespesaResponse {
  id: number | null; ano: number; mes: number; categoria: string | null;
  subcategoria: string | null; tipo: 'CORRENTE' | 'CAPITAL' | 'CONTINGENCIA';
  valor_empenhado: number; valor_liquidado: number; valor_pago: number; fonte: string;
}

// Serviços específicos da API
export const receitasApi = {
  list: async (params?: {
    ano?: number;
    mes?: number;
    categoria?: string;
    tipo?: string;
    ano_inicio?: number;
    ano_fim?: number;
    limit?: number;
    offset?: number;
  }): Promise<ReceitaListResponse> => {
    return apiClient.get<ReceitaListResponse>(API_ENDPOINTS.receitas.list, { params });
  },

  getById: async (id: number): Promise<ReceitaResponse> => {
    return apiClient.get<ReceitaResponse>(`${API_ENDPOINTS.receitas.list}/${id}`);
  },

  totalByYear: async (ano: number, tipo?: string): Promise<{ ano: number; tipo: string | null; total_arrecadado: number }> => {
    const url = API_ENDPOINTS.receitas.list.replace('/api/v1/receitas', `/api/v1/receitas/total/ano/${ano}`);
    return apiClient.get(url, { params: { tipo } });
  },

  totalByMonth: async (ano: number, mes: number, tipo?: string) => {
    const url = API_ENDPOINTS.receitas.list.replace('/api/v1/receitas', `/api/v1/receitas/total/mes/${ano}/${mes}`);
    return apiClient.get(url, { params: { tipo } });
  },

  getCategories: async (): Promise<string[]> => {
    const url = `${API_ENDPOINTS.receitas.list}/categorias`;
    return apiClient.get<string[]>(url);
  },
};

export const despesasApi = {
  list: async (params?: {
    ano?: number;
    mes?: number;
    categoria?: string;
    tipo?: string;
    ano_inicio?: number;
    ano_fim?: number;
    limit?: number;
    offset?: number;
  }): Promise<DespesaListResponse> => {
    return apiClient.get<DespesaListResponse>(API_ENDPOINTS.despesas.list, { params });
  },

  getById: async (id: number): Promise<DespesaResponse> => {
    return apiClient.get<DespesaResponse>(`${API_ENDPOINTS.despesas.list}/${id}`);
  },

  totalByYear: async (ano: number, tipo?: string): Promise<{ ano: number; tipo: string | null; total_pago: number }> => {
    const url = API_ENDPOINTS.despesas.list.replace('/api/v1/despesas', `/api/v1/despesas/total/ano/${ano}`);
    return apiClient.get(url, { params: { tipo } });
  },

  totalByMonth: async (ano: number, mes: number, tipo?: string) => {
    const url = API_ENDPOINTS.despesas.list.replace('/api/v1/despesas', `/api/v1/despesas/total/mes/${ano}/${mes}`);
    return apiClient.get(url, { params: { tipo } });
  },
};

interface KPIsResponse {
  periodo: string;
  receitas_total: number;
  despesas_total: number;
  saldo: number;
  percentual_execucao_receita: number | null;
  percentual_execucao_despesa: number | null;
  kpis_mensais: Array<{
    mes: number; ano: number; total_receitas: number;
    total_despesas: number; saldo: number;
    percentual_execucao_receita: number | null;
    percentual_execucao_despesa: number | null;
  }> | null;
  kpis_anuais: Array<{
    ano: number; total_receitas: number; total_despesas: number; saldo: number;
    receitas_correntes: number | null; receitas_capital: number | null;
    despesas_correntes: number | null; despesas_capital: number | null;
  }> | null;
}

interface ResumoResponse {
  total_registros: { receitas: number; despesas: number };
  anos_disponiveis: { receitas: number[]; despesas: number[]; todos: number[] };
  periodo: { inicio: number | null; fim: number | null };
  status: string;
}

export const kpisApi = {
  getKPIs: async (ano?: number): Promise<KPIsResponse> => {
    return apiClient.get<KPIsResponse>(API_ENDPOINTS.dashboard.summary, { params: { ano } });
  },

  getMonthlyKPIs: async (ano: number): Promise<KPIsResponse> => {
    const url = `/api/v1/kpis/mensal/${ano}`;
    return apiClient.get<KPIsResponse>(url);
  },

  getYearlyKPIs: async (ano_inicio?: number, ano_fim?: number): Promise<KPIsResponse> => {
    return apiClient.get<KPIsResponse>('/api/v1/kpis/anual', { params: { ano_inicio, ano_fim } });
  },

  getSummary: async (): Promise<ResumoResponse> => {
    return apiClient.get<ResumoResponse>('/api/v1/kpis/resumo');
  },
};

export default apiClient;