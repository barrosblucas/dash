/**
 * Parsers de licitações — ComprasBR e Dispensas Quality
 */

import { parseISO, parse, isValid } from 'date-fns';

import type {
  LicitacaoUnified,
  LicitacaoComprasBR,
  DispensaLicitacao,
  FonteLicitacao,
} from '@/types/licitacao';

import { COMPRASBR_URL, QUALITY_URL } from './constants';

export function parseComprasBR(raw: LicitacaoComprasBR[]): LicitacaoUnified[] {
  return raw
    .filter((item) => item?.dataAbertura)
    .map((item) => ({
      ...item,
      _parsedDate: parseISO(item.dataAbertura),
    }))
    .filter((item) => isValid(item._parsedDate))
    .map(({ _parsedDate, ...item }) => ({
      id: `comprasbr-${item.id}`,
      numero: item.numeroEdital || '',
      objeto: item.objeto || '',
      fonte: 'comprasbr' as FonteLicitacao,
      modalidade: item.modalidade || '',
      status: item.status || '',
      dataAbertura: _parsedDate,
      urlExterna: COMPRASBR_URL,
      urlProcesso: item.urlProcesso || COMPRASBR_URL,
      idOriginal: item.id,
      orgaoNome: item.orgaoNome || '',
    }));
}

export function parseDispensas(raw: DispensaLicitacao[]): LicitacaoUnified[] {
  return raw
    .filter((item) => item?.dataAbertura)
    .map((item) => ({
      ...item,
      _parsedDate: parse(item.dataAbertura, 'dd/MM/yyyy', new Date()),
      _parsedJulgamento: item.dataJulgamento
        ? parse(item.dataJulgamento, 'dd/MM/yyyy', new Date())
        : undefined,
    }))
    .filter((item) => isValid(item._parsedDate))
    .map(({ _parsedDate, _parsedJulgamento, ...item }) => ({
      id: `dispensa-${item.codigo}`,
      numero: item.processo || item.codigo,
      objeto: item.objeto || '',
      fonte: 'dispensa' as FonteLicitacao,
      modalidade: item.modalidade || 'DISPENSA',
      status: item.status || '',
      dataAbertura: _parsedDate,
      dataJulgamento: _parsedJulgamento && isValid(_parsedJulgamento)
        ? _parsedJulgamento
        : undefined,
      urlExterna: QUALITY_URL,
      urlProcesso: item.urlProcesso || QUALITY_URL,
      idOriginal: item.codigo,
      disputa: item.disputa,
      criterio: item.criterio,
      tipo: item.tipo,
    }));
}

/** Extrai um título sucinto do objeto longo da licitação */
export function extrairTituloSucinto(objeto: string): string {
  if (!objeto) return '';
  let limpo = objeto.trim();

  // Remove prefixo "Objeto" se existir
  if (limpo.toLowerCase().startsWith('objeto')) {
    limpo = limpo.slice(6).trim();
  }

  // Remove prefixos comuns
  const prefixos = [
    /registro\s+de\s+pre[çc]o\s+para\s+contrata[çc][ãa]o\s+de\s+empresa\s+especializada\s+(para\s+o|para)\s+/i,
    /contrata[çc][ãa]o\s+de\s+empresa\s+especializada\s+(para\s+o|para)\s+/i,
    /contrata[çc][ãa]o\s+de\s+empresa\s+especializada\s+/i,
  ];
  for (const prefixo of prefixos) {
    limpo = limpo.replace(prefixo, '');
  }

  // Remove sufixos comuns
  const sufixos = [
    /,\s*para\s+atender\s+[àa]s?\s*necessidades\s+do\s+Munic[íi]pio\s+de\s+Bandeirantes\/MS\.?/i,
    /,\s*incluindo\s+m[ãa]o\s+de\s+obra,\s+material\s+e\s+equipamentos/i,
    /\s+com\s+recursos\s+da\s+Proposta\s+n[º°]\s+\d+\s+do\s+Fundo\s+Nacional\s+de\s+Sa[úu]de[^.]*/i,
  ];
  for (const sufixo of sufixos) {
    limpo = limpo.replace(sufixo, '');
  }

  limpo = limpo.trim();

  // Tenta capturar frase em maiúsculas (até 10 palavras)
  const matchMaiusculas = limpo.match(/\b[A-ZÀ-Ü][A-ZÀ-Ü\s]{3,60}[A-ZÀ-Ü]\b/);
  if (matchMaiusculas) {
    const candidato = matchMaiusculas[0].trim();
    const palavras = candidato.split(/\s+/);
    if (palavras.length >= 2 && palavras.length <= 10) {
      return candidato;
    }
  }

  // Fallback: primeiras palavras do texto limpo (incluindo preposições)
  const palavras = limpo.split(/\s+/);
  const slice = palavras.slice(0, 10).join(' ');
  if (slice.length > 60) {
    return slice.slice(0, 60) + '…';
  }
  return slice;
}
