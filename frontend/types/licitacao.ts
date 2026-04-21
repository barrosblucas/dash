/**
 * Tipos para licitações e dispensas de licitação
 * Dashboard Financeiro - Bandeirantes MS
 */

// --- ComprasBR (Pregão Eletrônico / Concorrência) ---

export type StatusLicitacao = 'AGUARDANDO_ABERTURA' | 'ENCERRADO' | 'SUSPENSO';
export type ModalidadeLicitacao = 'PREGÃO ELETRÔNICO' | 'CONCORRÊNCIA';

export interface LicitacaoComprasBR {
  id: number;
  numeroEdital: string;
  objeto: string;
  status: StatusLicitacao;
  modalidade: ModalidadeLicitacao;
  orgaoNome: string;
  dataAbertura: string; // ISO 8601
  urlProcesso: string;
}

export interface LicitacaoComprasBRResponse {
  items: LicitacaoComprasBR[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
}

export interface LicitacaoComprasBRDocumento {
  id: number;
  tipo: string;
  arquivoNome: string;
  arquivoUri: string;
}

export interface LicitacaoComprasBRDetail {
  id: number;
  numeroEdital: string;
  numProcesso: string;
  objeto: string;
  status: string;
  modalidade: string;
  fase: string;
  orgaoNome: string;
  dataAbertura: string;
  dataIniEnvioProposta?: string;
  dataFimEnvioProposta?: string;
  tipoDisputa: string;
  modoDisputa: string;
  pregoeiro: string;
  legislacao: string;
  urlProcesso: string;
  documentos: LicitacaoComprasBRDocumento[];
}

// --- Dispensas de Licitação (Quality) ---

export type StatusDispensa = string;

export interface DispensaLicitacao {
  codigo: string;
  processo: string;
  disputa: string;
  criterio: string;
  tipo: string;
  dataAbertura: string; // dd/MM/yyyy
  dataJulgamento: string; // dd/MM/yyyy
  status: StatusDispensa;
  objeto: string;
  urlProcesso: string;
  modalidade: string;
}

export interface DispensasLicitacaoResponse {
  items: DispensaLicitacao[];
  quantidade: number;
}

// --- Unified view for calendar/list ---

export type FonteLicitacao = 'comprasbr' | 'dispensa';

export interface LicitacaoUnified {
  id: string;
  numero: string;
  objeto: string;
  fonte: FonteLicitacao;
  modalidade: string;
  status: string;
  dataAbertura: Date;
  dataJulgamento?: Date;
  /** URL externa para ver detalhes no portal de origem */
  urlExterna: string;
  /** URL direta para a página do processo */
  urlProcesso?: string;
  /** ID na fonte original (para download de edital) */
  idOriginal: number | string;
  /** Nome do órgão responsável (quando disponível) */
  orgaoNome?: string;
  /** Campos extras da Quality */
  disputa?: string;
  criterio?: string;
  tipo?: string;
}
